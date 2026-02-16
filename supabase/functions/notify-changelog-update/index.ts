import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChangelogNotificationPayload {
  version: string;
  title: string;
  description: string;
  category: string;
  is_major: boolean;
  action: "created" | "updated" | "deleted";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { version, title, description, category, is_major, action } = await req.json() as ChangelogNotificationPayload;

    const webhookUrl = Deno.env.get("DISCORD_CHANGELOG_WEBHOOK_URL");

    if (!webhookUrl) {
      console.log("Discord webhook not configured, skipping notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Webhook not configured" }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const categoryEmojis = {
      feature: "✨",
      bugfix: "🐛",
      improvement: "⚡",
      security: "🔒",
    };

    const categoryColors = {
      feature: 0x3b82f6,
      bugfix: 0xef4444,
      improvement: 0x22c55e,
      security: 0xeab308,
    };

    const actionEmojis = {
      created: "🆕",
      updated: "📝",
      deleted: "🗑️",
    };

    const emoji = categoryEmojis[category as keyof typeof categoryEmojis] || "📢";
    const color = categoryColors[category as keyof typeof categoryColors] || 0x6366f1;
    const actionEmoji = actionEmojis[action];

    const embed = {
      title: `${actionEmoji} Changelog ${action.charAt(0).toUpperCase() + action.slice(1)}: ${version}`,
      description: `**${emoji} ${title}**\n\n${description}`,
      color: color,
      fields: [
        {
          name: "Category",
          value: category.charAt(0).toUpperCase() + category.slice(1),
          inline: true,
        },
        {
          name: "Type",
          value: is_major ? "🔥 Major Update" : "Minor Update",
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "UserVault Changelog System",
      },
    };

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord webhook error:", discordResponse.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send Discord notification",
          details: errorText
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, notified: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending changelog notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
