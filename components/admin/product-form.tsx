"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "./image-upload";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductFormProps {
  product?: Doc<"products">;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const categories = useQuery(api.categories.list);
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription ?? ""
  );
  const [price, setPrice] = useState(
    product ? (product.price / 100).toFixed(2) : ""
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ""
  );
  const [categoryId, setCategoryId] = useState<string>(
    product?.categoryId ?? ""
  );
  const [productType, setProductType] = useState<"physical" | "digital">(
    product?.productType ?? "physical"
  );
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [weight, setWeight] = useState(product?.weight?.toString() ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [hasAuthCertificate, setHasAuthCertificate] = useState(
    product?.hasAuthCertificate ?? false
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [images, setImages] = useState<Id<"_storage">[]>(
    product?.images ?? []
  );
  const [tags, setTags] = useState(product?.tags?.join(", ") ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);
    try {
      const priceInCents = Math.round(parseFloat(price) * 100);
      const compareAtPriceInCents = compareAtPrice
        ? Math.round(parseFloat(compareAtPrice) * 100)
        : undefined;
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (product) {
        await updateProduct({
          id: product._id,
          name,
          description,
          shortDescription: shortDescription || undefined,
          price: priceInCents,
          compareAtPrice: compareAtPriceInCents,
          categoryId: categoryId as Id<"categories">,
          productType,
          stock: parseInt(stock),
          sku: sku || undefined,
          weight: weight ? parseFloat(weight) : undefined,
          isFeatured,
          hasAuthCertificate,
          isActive,
          images,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
        });
        toast.success("Product updated");
      } else {
        await createProduct({
          name,
          description,
          shortDescription: shortDescription || undefined,
          price: priceInCents,
          compareAtPrice: compareAtPriceInCents,
          categoryId: categoryId as Id<"categories">,
          productType,
          stock: parseInt(stock),
          sku: sku || undefined,
          weight: weight ? parseFloat(weight) : undefined,
          isFeatured,
          hasAuthCertificate,
          isActive,
          images,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
        });
        toast.success("Product created");
      }
      router.push("/admin/products");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Basic Information</h3>

        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Input
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Full Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare at Price ($)</Label>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Organization</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select
              value={productType}
              onValueChange={(v) =>
                v && setProductType(v as "physical" | "digital")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. electronics, new-arrival, sale"
          />
        </div>
      </div>

      {/* Inventory */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Inventory</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          {productType === "physical" && (
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (g)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Images</h3>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Featured Product</Label>
            <p className="text-sm text-muted-foreground">
              Show on the homepage
            </p>
          </div>
          <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Active</Label>
            <p className="text-sm text-muted-foreground">
              Visible in the store
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Authenticity Certificate</Label>
            <p className="text-sm text-muted-foreground">
              Mint authenticity NFT on successful crypto purchase
            </p>
          </div>
          <Switch
            checked={hasAuthCertificate}
            onCheckedChange={setHasAuthCertificate}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {product ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}
