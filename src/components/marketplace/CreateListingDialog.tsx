import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge, Package, Upload, Coins, AlertCircle } from 'lucide-react';
import { useCreateMarketplaceItem } from '@/hooks/useMarketplace';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CreateListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateListingDialog({ open, onOpenChange }: CreateListingDialogProps) {
  const [itemType, setItemType] = useState<'badge' | 'template'>('badge');
  const [saleType, setSaleType] = useState<'single' | 'limited' | 'unlimited'>('unlimited');
  const [stockLimit, setStockLimit] = useState(10);
  const [price, setPrice] = useState(100);
  const [uploading, setUploading] = useState(false);
  
  // Badge fields
  const [badgeName, setBadgeName] = useState('');
  const [badgeDescription, setBadgeDescription] = useState('');
  const [badgeColor, setBadgeColor] = useState('#8B5CF6');
  const [badgeIconUrl, setBadgeIconUrl] = useState('');
  
  // Template fields
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState('');
  
  const createMutation = useCreateMarketplaceItem();

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `marketplace/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-assets')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-assets')
        .getPublicUrl(filePath);
      
      if (itemType === 'badge') {
        setBadgeIconUrl(publicUrl);
      } else {
        setTemplatePreviewUrl(publicUrl);
      }
      
      toast.success('Image uploaded!');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (itemType === 'badge' && !badgeName.trim()) {
      toast.error('Badge name is required');
      return;
    }
    if (itemType === 'template' && !templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (price < 1 || price > 10000) {
      toast.error('Price must be between 1 and 10,000 UV');
      return;
    }
    if (saleType === 'limited' && stockLimit < 1) {
      toast.error('Stock limit must be at least 1');
      return;
    }

    createMutation.mutate({
      item_type: itemType,
      sale_type: saleType,
      stock_limit: saleType === 'limited' ? stockLimit : null,
      price,
      badge_name: itemType === 'badge' ? badgeName : null,
      badge_description: itemType === 'badge' ? badgeDescription : null,
      badge_color: itemType === 'badge' ? badgeColor : null,
      badge_icon_url: itemType === 'badge' ? badgeIconUrl : null,
      template_name: itemType === 'template' ? templateName : null,
      template_description: itemType === 'template' ? templateDescription : null,
      template_preview_url: itemType === 'template' ? templatePreviewUrl : null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setBadgeName('');
        setBadgeDescription('');
        setBadgeColor('#8B5CF6');
        setBadgeIconUrl('');
        setTemplateName('');
        setTemplateDescription('');
        setTemplatePreviewUrl('');
        setPrice(100);
        setSaleType('unlimited');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Marketplace Listing</DialogTitle>
          <DialogDescription>
            List a badge or profile template for sale. Items require admin approval before appearing in the marketplace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Type Selection */}
          <Tabs value={itemType} onValueChange={(v) => setItemType(v as 'badge' | 'template')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="badge" className="gap-2">
                <Badge className="w-4 h-4" />
                Badge
              </TabsTrigger>
              <TabsTrigger value="template" className="gap-2">
                <Package className="w-4 h-4" />
                Template
              </TabsTrigger>
            </TabsList>

            <TabsContent value="badge" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="badgeName">Badge Name *</Label>
                <Input
                  id="badgeName"
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder="e.g. Golden Crown"
                  maxLength={32}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badgeDescription">Description</Label>
                <Textarea
                  id="badgeDescription"
                  value={badgeDescription}
                  onChange={(e) => setBadgeDescription(e.target.value)}
                  placeholder="Describe your badge..."
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badgeColor">Badge Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="badgeColor"
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Badge Icon</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => document.getElementById('iconUpload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <input
                      id="iconUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIconUpload}
                    />
                  </div>
                  {badgeIconUrl && (
                    <img src={badgeIconUrl} alt="Preview" className="w-10 h-10 rounded object-contain border" />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4 mt-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-500">
                  Template selling coming soon! You'll be able to export your profile settings and sell them.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Neon Dreams"
                  maxLength={32}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe your template..."
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Preview Image</Label>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => document.getElementById('iconUpload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Preview'}
                </Button>
                {templatePreviewUrl && (
                  <img src={templatePreviewUrl} alt="Preview" className="w-full h-32 rounded object-cover border" />
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Sale Type */}
          <div className="space-y-3">
            <Label>Sale Type</Label>
            <RadioGroup value={saleType} onValueChange={(v) => setSaleType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unlimited" id="unlimited" />
                <Label htmlFor="unlimited" className="font-normal cursor-pointer">
                  Unlimited - Anyone can buy, you keep the item
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="limited" id="limited" />
                <Label htmlFor="limited" className="font-normal cursor-pointer">
                  Limited - Set max copies, you keep the item
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  Unique Sale - One buyer, you lose the item
                </Label>
              </div>
            </RadioGroup>
          </div>

          {saleType === 'limited' && (
            <div className="space-y-2">
              <Label htmlFor="stockLimit">Stock Limit</Label>
              <Input
                id="stockLimit"
                type="number"
                min={1}
                max={1000}
                value={stockLimit}
                onChange={(e) => setStockLimit(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (UV)</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <Input
                id="price"
                type="number"
                min={1}
                max={10000}
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value) || 1)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">Price must be between 1 and 10,000 UV</p>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
