import { useState } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function AdminDiscordSender() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [embedColor, setEmbedColor] = useState('#5865F2');
  const [footerText, setFooterText] = useState('UserVault Team');

  const handleSendMessage = async () => {
    if (!channelId.trim()) {
      toast({ title: 'Channel ID is required', variant: 'destructive' });
      return;
    }

    if (!embedTitle.trim() && !embedDescription.trim()) {
      toast({ title: 'Title or description is required', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const colorInt = parseInt(embedColor.replace('#', ''), 16);

      const embed = {
        title: embedTitle || undefined,
        description: embedDescription || undefined,
        color: colorInt,
        footer: footerText ? { text: footerText } : undefined,
        timestamp: new Date().toISOString(),
      };

      const response = await supabase.functions.invoke('send-discord-message', {
        body: {
          channelId: channelId.trim(),
          embed,
        },
      });

      if (response.error) throw response.error;

      toast({ title: 'Message sent successfully!' });
      setEmbedTitle('');
      setEmbedDescription('');
    } catch (error: any) {
      toast({ title: error.message || 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Discord Message Sender</h3>
          <p className="text-xs text-muted-foreground">Send announcements to Discord channels</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm">Channel ID</Label>
          <Input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="1234567890123456789"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            The Discord channel ID to send the message to
          </p>
        </div>

        <div>
          <Label className="text-sm">Embed Title</Label>
          <Input
            value={embedTitle}
            onChange={(e) => setEmbedTitle(e.target.value)}
            placeholder="Website Status Update"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm">Embed Description</Label>
          <Textarea
            value={embedDescription}
            onChange={(e) => setEmbedDescription(e.target.value)}
            placeholder="Enter your message here..."
            rows={6}
            className="mt-1.5 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supports Discord markdown formatting
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Embed Color</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="color"
                value={embedColor}
                onChange={(e) => setEmbedColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={embedColor}
                onChange={(e) => setEmbedColor(e.target.value)}
                placeholder="#5865F2"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Footer Text</Label>
            <Input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="UserVault Team"
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
          <div
            className="rounded-md p-4 border-l-4"
            style={{
              backgroundColor: `${embedColor}10`,
              borderLeftColor: embedColor,
            }}
          >
            {embedTitle && <p className="font-semibold text-sm mb-1">{embedTitle}</p>}
            {embedDescription && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{embedDescription}</p>
            )}
            {footerText && (
              <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">{footerText}</p>
            )}
          </div>
        </div>

        <Button onClick={handleSendMessage} disabled={isSending} className="w-full">
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
