import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Check, Sparkles, Palette, Globe, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { invokeSecure } from "@/lib/secureEdgeFunctions";

interface PremiumCheckoutProps {
  onSuccess?: () => void;
}

const PREMIUM_PRICE = 3.50;
const CURRENCY = "USD";

const PREMIUM_FEATURES = [
  { icon: Palette, text: "Advanced Themes & Animations" },
  { icon: Sparkles, text: "Exclusive Effects & Fonts" },
  { icon: Globe, text: "Custom Domain for your Profile" },
  { icon: Crown, text: "Premium Badge on your Profile" },
];

export function PremiumCheckout({ onSuccess }: PremiumCheckoutProps) {
  const [{ isPending, isResolved }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    type: string;
  } | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const { toast } = useToast();

  const finalPrice = appliedPromo 
    ? Math.max(0, PREMIUM_PRICE * (1 - appliedPromo.discount / 100))
    : PREMIUM_PRICE;
  
  const isFreeWithCode = appliedPromo?.discount === 100;

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidatingCode(true);
    try {
      const { data, error } = await invokeSecure<{
        valid: boolean;
        code?: string;
        discount?: number;
        type?: string;
        error?: string;
      }>('validate-promo-code', {
        body: { code: promoCode.trim() }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Could not validate promo code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data?.valid) {
        toast({
          title: "Invalid Code",
          description: data?.error || "This promo code is not valid or has expired.",
          variant: "destructive",
        });
        return;
      }

      setAppliedPromo({
        code: data.code!,
        discount: data.discount!,
        type: data.type!,
      });

      toast({
        title: data.type === 'gift' ? "🎁 Gift Code Applied!" : "💰 Discount Applied!",
        description: data.discount === 100 
          ? "You get Premium for FREE!" 
          : `${data.discount}% discount applied!`,
      });
    } catch (err) {
      console.error("Error validating promo code:", err);
      toast({
        title: "Error",
        description: "Could not validate promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const handleFreeActivation = async () => {
    if (!appliedPromo || appliedPromo.discount !== 100) return;
    
    setIsProcessing(true);
    try {
      const { data: result, error } = await invokeSecure<{ success?: boolean; error?: string }>('verify-paypal-payment', {
        body: { 
          orderId: `PROMO-${Date.now()}`,
          promoCode: appliedPromo.code,
          isFreePromo: true
        }
      });

      if (error) {
        throw new Error(error.message || 'Activation failed');
      }

      if (result?.success) {
        toast({
          title: "🎉 Premium Activated!",
          description: "Welcome to UserVault Premium! All features are now unlocked.",
        });
        onSuccess?.();
      } else {
        throw new Error(result?.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error("Free activation error:", error);
      toast({
        title: "Error",
        description: error.message || "Activation failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    
    try {
      console.log("Payment approved, verifying order:", data.orderID);
      
      const { data: result, error } = await invokeSecure<{ success?: boolean; error?: string }>('verify-paypal-payment', {
        body: { 
          orderId: data.orderID,
          promoCode: appliedPromo?.code || null
        }
      });

      if (error) {
        console.error("Verification error:", error);
        throw new Error(error.message || 'Payment verification failed');
      }

      if (result?.success) {
        toast({
          title: "🎉 Premium Activated!",
          description: "Welcome to UserVault Premium! All features are now unlocked.",
        });
        onSuccess?.();
      } else {
        throw new Error(result?.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast({
        title: "Error",
        description: error.message || "Payment could not be processed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (err: any) => {
    console.error("PayPal error:", err);
    toast({
      title: "PayPal Error",
      description: "There was a problem with PayPal. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
          UserVault Premium
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          One-time Payment • Lifetime Access
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Price */}
        <div className="text-center">
          {appliedPromo ? (
            <div className="space-y-1">
              <span className="text-2xl text-muted-foreground line-through">${PREMIUM_PRICE.toFixed(2)}</span>
              <span className="text-4xl font-bold text-primary ml-2">
                {isFreeWithCode ? "FREE" : `$${finalPrice.toFixed(2)}`}
              </span>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  {appliedPromo.type === 'gift' ? '🎁 Gift Code' : `${appliedPromo.discount}% OFF`}
                </span>
                <button 
                  onClick={removePromoCode}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="text-4xl font-bold text-foreground">${PREMIUM_PRICE.toFixed(2)}</span>
              <span className="text-muted-foreground ml-2">one-time</span>
            </>
          )}
        </div>

        {/* Promo Code Input */}
        {!appliedPromo && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={validatePromoCode}
              disabled={isValidatingCode || !promoCode.trim()}
            >
              {isValidatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        )}

        {/* Features */}
        <ul className="space-y-3">
          {PREMIUM_FEATURES.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground">{feature.text}</span>
            </li>
          ))}
        </ul>

        {/* Payment Button */}
        <div className="pt-4">
          {isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading PayPal...</span>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Processing...</span>
            </div>
          )}

          {/* Free activation with 100% code */}
          {isFreeWithCode && !isProcessing && (
            <Button 
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              onClick={handleFreeActivation}
            >
              🎁 Activate Premium for FREE
            </Button>
          )}

          {/* PayPal for paid orders */}
          {isResolved && !isProcessing && !isFreeWithCode && (
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "pay",
                height: 50,
              }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: CURRENCY,
                        value: finalPrice.toFixed(2),
                      },
                      description: appliedPromo 
                        ? `UserVault Premium - ${appliedPromo.discount}% OFF (Code: ${appliedPromo.code})`
                        : "UserVault Premium - Lifetime Access",
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                if (actions.order) {
                  await actions.order.capture();
                }
                await handleApprove({ orderID: data.orderID });
              }}
              onError={handleError}
              onCancel={() => {
                toast({
                  title: "Cancelled",
                  description: "You cancelled the payment.",
                });
              }}
            />
          )}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-500" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-500" />
            <span>Instant Activation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
