# 🔒 UserVault Security Documentation

> **Last Updated:** February 2026  
> **Security Level:** Production-Ready

---

## Table of Contents

1. [Authentication & Access Control](#authentication--access-control)
2. [Rate Limiting & Anti-Abuse](#rate-limiting--anti-abuse)
3. [Data Protection & Privacy](#data-protection--privacy)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [API Security](#api-security)
6. [Session Management](#session-management)
7. [Database Security](#database-security)
8. [Edge Function Security](#edge-function-security)
9. [Frontend Security](#frontend-security)

---

## Authentication & Access Control

### Multi-Factor Authentication (MFA)
- **TOTP Support**: Users can enable 2FA via authenticator apps
- **AAL2 Enforcement**: MFA verification required before accessing protected resources
- **Factor Management**: Users can enroll, verify, and manage TOTP factors

### Password Security
- **Custom OTP Flow**: 6-digit verification codes for password resets (replaces default Supabase flow)
- **Code Expiration**: Verification codes expire after 15 minutes
- **Code Invalidation**: Previous unused codes are invalidated when new ones are requested
- **Rate Limited**: Maximum 5 codes per email per hour

### Email Verification
- **Verified Domain**: All emails sent from verified `uservault.cc` domain via Resend
- **Professional Templates**: Dark-mode HTML templates with table-based layouts for cross-client compatibility
- **Anti-Enumeration**: Generic error messages prevent user enumeration attacks

### Bot Protection
- **Cloudflare Turnstile**: Enforced on all authentication flows
- **Fail-Closed**: Missing or invalid Turnstile tokens reject the request
- **No Bypass**: All development/preview bypasses removed

---

## Rate Limiting & Anti-Abuse

### IP-Based Rate Limiting

| Endpoint | Limit | Window | Lockout |
|----------|-------|--------|---------|
| `get-user-email` | 3 requests | 1 minute | 1 hour after 5 failures |
| `api-proxy` | 60 requests | 1 minute | Temporary block |
| `submit-ban-appeal` | 3 requests | 24 hours | Rejection |
| `alias-request` | 10 requests | 1 minute | Temporary block |

### Resource-Specific Rate Limiting

| Resource | Limit | Window |
|----------|-------|--------|
| Username lookups | 2 attempts | 10 minutes |
| Verification codes | 5 codes | 1 hour |
| Live chat messages | 10 messages | 1 minute |
| Profile views | 1 view | 30 minutes (per IP/profile) |

### Lockout Mechanisms
- **Progressive Lockout**: 5 failed attempts → 1 hour lockout
- **IP Tracking**: Hashed IPs for privacy-preserving rate limiting
- **Automatic Cleanup**: Expired records cleaned via scheduled functions

---

## Data Protection & Privacy

### Email Obfuscation
```
Raw:        john.doe@gmail.com
Masked:     j*****e@g***l.com
Obfuscated: XOR-encoded with timestamp key
```

- **Never Exposed**: Raw emails never returned to frontend
- **Timestamp Key**: XOR obfuscation uses request timestamp
- **Display Only**: Masked version for UI display

### Timing Attack Prevention
- **Random Delays**: 200-500ms added to sensitive endpoints
- **Consistent Responses**: Same response time for valid/invalid requests
- **Generic Errors**: "Invalid credentials" for all auth failures

### IP Privacy
- **Hashing**: IPs hashed before storage/logging
- **Salt**: Service role key used as salt
- **No Raw Storage**: Original IPs never persisted

---

## Row Level Security (RLS)

### Role-Based Access Control

```sql
-- Roles stored in separate table (never in profiles!)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Security definer function prevents RLS recursion
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role) $$;
```

### Table Access Matrix

| Table | Public | Auth User | Owner | Admin |
|-------|--------|-----------|-------|-------|
| `profiles` | Via RPC | Own only | Full | Full |
| `social_links` | Read | Read | CRUD | Read |
| `badges` | Read | Read | CRUD | Read |
| `user_badges` | Read | Read | Update | Full |
| `discord_presence` | Read | Read | Full | Read |
| `purchases` | ❌ | ❌ | ❌ | Read |
| `banned_users` | ❌ | ❌ | ❌ | Full |
| `verification_codes` | ❌ | ❌ | ❌ | Service Role |
| `promo_codes` | ❌ | ❌ | ❌ | Full |
| `support_tickets` | ❌ | ❌ | ❌ | Full |
| `live_chat_*` | ❌ | Participant | Participant | Full |

### Service Role Only Tables
These tables use `USING (false)` policies - only accessible via edge functions:
- `verification_codes`
- `purchases` (insert)
- `promo_code_uses` (insert)
- `link_clicks` (insert)

---

## API Security

### API Proxy Architecture
```
Browser → api-proxy (Edge Function) → Database
         ↓
         Sanitized Response (minimized keys)
```

- **No Direct Access**: Frontend never queries sensitive tables directly
- **Field Whitelisting**: Only approved fields returned
- **Key Minimization**: Internal keys shortened (`u` for username, `d` for display_name)
- **UUID Hiding**: Internal IDs never exposed to browser

### Public Profile Access
```sql
-- SECURITY DEFINER function for public profile data
CREATE FUNCTION get_public_profile(p_username text)
RETURNS TABLE(...) -- Only safe fields
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
```

### CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, ...',
};
```

---

## Session Management

### Password Reset Flow
1. User requests reset → 6-digit OTP generated
2. OTP sent via email → User enters code
3. Code verified → Password updated
4. **All sessions invalidated globally**

### MFA Flow
1. User logs in with password
2. System detects MFA enrolled (AAL2 required)
3. Challenge created for TOTP factor
4. User enters 6-digit code
5. Session upgraded to AAL2

### Ban Detection
- Ban status checked on every login
- Banned users see appeal screen (if eligible)
- Appeal deadline enforced (30 days)

---

## Database Security

### Validation Triggers

```sql
-- Used instead of CHECK constraints for time-based validation
CREATE FUNCTION validate_verification_code_insert()
RETURNS trigger AS $$
BEGIN
  -- Validate code format
  IF NEW.code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'Invalid verification code format';
  END IF;
  
  -- Rate limit check
  IF recent_codes_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Protected Columns
```sql
-- UID cannot be modified except by admins
CREATE FUNCTION prevent_uid_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.uid_number IS DISTINCT FROM NEW.uid_number THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'uid_number cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Uniqueness Enforcement
```sql
-- Prevent username/alias collisions
CREATE FUNCTION check_username_alias_uniqueness()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE alias_username = NEW.username AND id != NEW.id) THEN
    RAISE EXCEPTION 'Username already taken as alias';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Edge Function Security

### Authentication Patterns

```typescript
// JWT validation in code (verify_jwt = false in config)
const authHeader = req.headers.get('Authorization');
const { data: { user }, error } = await supabase.auth.getUser(token);

// Admin check
const { data: isAdmin } = await supabase.rpc('has_role', { 
  _user_id: user.id, 
  _role: 'admin' 
});
```

### Service Role Usage
- **When**: Backend-only operations (writes to protected tables)
- **How**: `createClient(url, SERVICE_ROLE_KEY)`
- **Why**: Bypasses RLS for server-side operations

### Secret Management
| Secret | Purpose |
|--------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Backend database access |
| `RESEND_API_KEY` | Email sending |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Bot protection |
| `DISCORD_BOT_TOKEN` | Discord integrations |
| `PAYPAL_CLIENT_ID` | Payment processing |

---

## Frontend Security

### XSS Prevention
- **React JSX**: Auto-escapes all user content
- **No eval()**: No dynamic code execution
- **Audited innerHTML**: Only used for:
  - ASCII art generation (canvas pixel data)
  - Turnstile container cleanup
  - CSS variable injection (typed config)

### Sensitive Data Handling
- **No localStorage for auth**: Session managed by Supabase client
- **No hardcoded credentials**: All secrets in environment
- **No client-side role checks**: Always verified server-side

### Content Security
- **User Uploads**: Validated and stored in Supabase Storage
- **URL Validation**: Social links validated before display
- **Image Sources**: Only allowed from trusted domains

---

## Security Checklist

### ✅ Implemented
- [x] Role-based access control with separate table
- [x] RLS on all tables
- [x] Rate limiting on sensitive endpoints
- [x] Email obfuscation
- [x] Timing attack prevention
- [x] MFA support
- [x] Bot protection (Turnstile)
- [x] Session invalidation on password reset
- [x] Generic error messages
- [x] API proxy for data sanitization
- [x] Service role only tables
- [x] Validation triggers
- [x] IP hashing for privacy

### 🔄 Ongoing
- [ ] Regular security scans
- [ ] Dependency updates
- [ ] Log monitoring
- [ ] Incident response procedures

---

## Reporting Security Issues

If you discover a security vulnerability, please report it to:
- **Email**: security@uservault.cc
- **Response Time**: Within 48 hours

Do not publicly disclose security issues until they have been addressed.

---

*This document is maintained as part of the UserVault security program.*
