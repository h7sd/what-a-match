-- Drop existing restrictive policies on live_chat_conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Admins can manage conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Anyone can create a conversation" ON public.live_chat_conversations;

-- Create PERMISSIVE policies (default behavior - any matching policy grants access)
CREATE POLICY "Anyone can create a conversation"
ON public.live_chat_conversations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view their own conversations"
ON public.live_chat_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Visitors can view their conversations"
ON public.live_chat_conversations
FOR SELECT
TO anon
USING (visitor_id IS NOT NULL);

CREATE POLICY "Admins can view all conversations"
ON public.live_chat_conversations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update conversations"
ON public.live_chat_conversations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their conversations"
ON public.live_chat_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix live_chat_messages policies too
DROP POLICY IF EXISTS "Admins can view all messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Service role can manage messages" ON public.live_chat_messages;

-- Create permissive policies for messages
CREATE POLICY "Anyone can insert messages"
ON public.live_chat_messages
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view their conversation messages"
ON public.live_chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.live_chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Visitors can view their conversation messages"
ON public.live_chat_messages
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.live_chat_conversations c
    WHERE c.id = conversation_id AND c.visitor_id IS NOT NULL
  )
);

CREATE POLICY "Admins can view all messages"
ON public.live_chat_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));