import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, CheckCircle2, Shield } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
});

const signupSchema = loginSchema.extend({
  username: z
    .string()
    .min(1, 'Username muss mindestens 1 Zeichen haben')
    .max(20, 'Username darf maximal 20 Zeichen haben')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username darf nur Buchstaben, Zahlen und Unterstriche enthalten'),
});

type AuthStep = 'login' | 'signup' | 'verify' | 'forgot-password' | 'reset-password' | 'mfa-verify';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const { signIn, signUp, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle password reset from email link
  useEffect(() => {
    const type = searchParams.get('type');
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');
    
    if (type === 'recovery' && emailParam && codeParam) {
      setEmail(emailParam);
      setVerificationCode(codeParam);
      setStep('reset-password');
    }
  }, [searchParams]);

  const sendVerificationEmail = async (targetEmail: string, code: string, type: 'signup' | 'email_change') => {
    const response = await supabase.functions.invoke('send-verification-email', {
      body: { email: targetEmail, code, type },
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Fehler beim Senden der E-Mail');
    }
    
    return response.data;
  };

  const sendPasswordResetEmail = async (targetEmail: string) => {
    // Generate a password reset token/code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    
    // Store the reset code in database
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        email: targetEmail.toLowerCase(),
        code,
        type: 'password_reset',
        expires_at: expiresAt,
      });

    if (codeError) {
      throw new Error('Fehler beim Erstellen des Reset-Codes');
    }

    // Build the reset URL with the code
    const resetUrl = `${window.location.origin}/auth?type=recovery&email=${encodeURIComponent(targetEmail)}&code=${code}`;
    
    // Send email via our Resend edge function
    const response = await supabase.functions.invoke('send-password-reset', {
      body: { email: targetEmail, resetUrl },
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Fehler beim Senden der E-Mail');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (step === 'login') {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error, needsMfa, factorId } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Fehler beim Anmelden',
            description: error.message === 'Invalid login credentials' 
              ? 'E-Mail oder Passwort falsch'
              : error.message,
            variant: 'destructive',
          });
        } else if (needsMfa && factorId) {
          // User has 2FA enabled, need to verify
          setMfaFactorId(factorId);
          setStep('mfa-verify');
          toast({ title: '2FA erforderlich', description: 'Bitte gib deinen Authenticator-Code ein.' });
        } else {
          toast({ title: 'Willkommen zurück!' });
          navigate('/dashboard');
        }
      } else if (step === 'signup') {
        const result = signupSchema.safeParse({ email, password, username });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        // Generate verification code
        const code = generateCode();
        
        // Store verification code in database
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
        const { error: codeError } = await supabase
          .from('verification_codes')
          .insert({
            email: email.toLowerCase(),
            code,
            type: 'signup',
            expires_at: expiresAt,
          });

        if (codeError) {
          throw new Error('Fehler beim Erstellen des Codes');
        }

        // Send verification email
        await sendVerificationEmail(email, code, 'signup');
        
        toast({ 
          title: 'Verifizierungscode gesendet!', 
          description: 'Prüfe deine E-Mails und gib den 6-stelligen Code ein.' 
        });
        
        setStep('verify');
      } else if (step === 'forgot-password') {
        const emailResult = z.string().email('Ungültige E-Mail-Adresse').safeParse(email);
        if (!emailResult.success) {
          setErrors({ email: emailResult.error.errors[0].message });
          setLoading(false);
          return;
        }

        await sendPasswordResetEmail(email);
        
        toast({ 
          title: 'E-Mail gesendet!', 
          description: 'Falls ein Account existiert, erhältst du einen Link zum Zurücksetzen.' 
        });
        
        setStep('login');
      } else if (step === 'reset-password') {
        if (newPassword.length < 6) {
          setErrors({ newPassword: 'Passwort muss mindestens 6 Zeichen haben' });
          setLoading(false);
          return;
        }

        // Get code and email from URL
        const codeParam = searchParams.get('code');
        const emailParam = searchParams.get('email');
        
        if (!codeParam || !emailParam) {
          toast({
            title: 'Ungültiger Link',
            description: 'Bitte fordere einen neuen Passwort-Reset an.',
            variant: 'destructive',
          });
          setStep('forgot-password');
          setLoading(false);
          return;
        }

        // Call edge function to reset password
        const response = await supabase.functions.invoke('reset-password', {
          body: { 
            email: emailParam, 
            code: codeParam, 
            newPassword 
          },
        });

        if (response.error || response.data?.error) {
          toast({
            title: 'Fehler beim Zurücksetzen',
            description: response.data?.error || response.error?.message || 'Bitte versuche es erneut.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Passwort geändert!', description: 'Du kannst dich jetzt einloggen.' });
          setStep('login');
          navigate('/auth');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      toast({
        title: 'Ein Fehler ist aufgetreten',
        description: err.message || 'Bitte versuche es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({ title: 'Bitte gib den 6-stelligen Code ein', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Check code in database
      const { data: codes, error: fetchError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', verificationCode)
        .eq('type', 'signup')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !codes || codes.length === 0) {
        toast({ 
          title: 'Ungültiger oder abgelaufener Code', 
          description: 'Bitte fordere einen neuen Code an.',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      // Mark code as used
      await supabase
        .from('verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codes[0].id);

      // Now create the actual account
      const { data: signUpData, error: signUpError } = await signUp(email, password, username);
      
      if (signUpError) {
        toast({
          title: 'Fehler beim Erstellen des Accounts',
          description: signUpError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Mark email as verified in profile
      if (signUpData?.user) {
        // Wait a moment for the profile to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await supabase
          .from('profiles')
          .update({ email_verified: true })
          .eq('user_id', signUpData.user.id);
      }

      toast({ title: 'Account erstellt!', description: 'Willkommen bei UserVault!' });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Verification error:', err);
      toast({
        title: 'Fehler bei der Verifizierung',
        description: err.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      await supabase
        .from('verification_codes')
        .insert({
          email: email.toLowerCase(),
          code,
          type: 'signup',
          expires_at: expiresAt,
        });

      await sendVerificationEmail(email, code, 'signup');
      
      toast({ title: 'Neuer Code gesendet!', description: 'Prüfe deine E-Mails.' });
    } catch (err: any) {
      toast({
        title: 'Fehler beim Senden',
        description: err.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (mfaCode.length !== 6 || !mfaFactorId) {
      toast({ title: 'Bitte gib den 6-stelligen Code ein', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyMfa(mfaFactorId, mfaCode);
      
      if (error) {
        toast({
          title: 'Ungültiger Code',
          description: 'Bitte überprüfe deinen Authenticator-Code.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Erfolgreich angemeldet!' });
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({
        title: 'Fehler bei der Verifizierung',
        description: err.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => {
    switch (step) {
      case 'login': return 'Willkommen zurück';
      case 'signup': return 'Account erstellen';
      case 'verify': return 'E-Mail verifizieren';
      case 'forgot-password': return 'Passwort vergessen';
      case 'reset-password': return 'Neues Passwort';
      case 'mfa-verify': return 'Zwei-Faktor-Authentifizierung';
      default: return 'Auth';
    }
  };

  const renderDescription = () => {
    switch (step) {
      case 'login': return 'Melde dich an, um deine Bio-Page zu verwalten';
      case 'signup': return 'Erstelle deine eigene personalisierte Bio-Page';
      case 'verify': return `Wir haben einen 6-stelligen Code an ${email} gesendet`;
      case 'forgot-password': return 'Gib deine E-Mail ein, um dein Passwort zurückzusetzen';
      case 'reset-password': return 'Wähle ein neues, sicheres Passwort';
      case 'mfa-verify': return 'Gib den 6-stelligen Code aus deiner Authenticator-App ein';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        <div className="glass-card p-8">
          <div className="text-center mb-8">
            {step === 'verify' && (
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            )}
            <h1 className="text-2xl font-bold gradient-text mb-2">
              {renderTitle()}
            </h1>
            <p className="text-muted-foreground text-sm">
              {renderDescription()}
            </p>
          </div>

          {/* Login Form */}
          {step === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="du@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Passwort</Label>
                  <button
                    type="button"
                    onClick={() => setStep('forgot-password')}
                    className="text-xs text-primary hover:underline"
                  >
                    Vergessen?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Anmelden
              </Button>
            </form>
          )}

          {/* Signup Form */}
          {step === 'signup' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="cooluser"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="du@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Weiter
              </Button>
            </form>
          )}

          {/* Verification Form */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verifizieren
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  Keinen Code erhalten? Erneut senden
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Form */}
          {step === 'forgot-password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="du@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Link senden
              </Button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Zurück zum Login
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {step === 'reset-password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Passwort speichern
              </Button>
            </form>
          )}

          {/* MFA Verification Form */}
          {step === 'mfa-verify' && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={mfaCode}
                  onChange={setMfaCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleMfaVerify}
                disabled={loading || mfaCode.length !== 6}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verifizieren
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setMfaCode('');
                    setMfaFactorId(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  ← Zurück zum Login
                </button>
              </div>
            </div>
          )}

          {/* Toggle between login and signup */}
          {(step === 'login' || step === 'signup') && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep(step === 'login' ? 'signup' : 'login');
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                {step === 'login'
                  ? 'Noch kein Account? Registrieren'
                  : 'Bereits einen Account? Anmelden'}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('signup');
                  setVerificationCode('');
                }}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                ← Zurück zur Registrierung
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
