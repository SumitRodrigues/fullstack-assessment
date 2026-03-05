'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products';

export default function ProductPage() {
    const params = useParams();
    const sku = params.sku as string;
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sku) return;

        setLoading(true);
        setError(null);

        fetch(`/api/products/${encodeURIComponent(sku)}`)
            .then((res) => {
                if (!res.ok) throw new Error('Product not found');
                return res.json();
            })
            .then((data) => {
                setProduct(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [sku]);

    const handlePrevImage = useCallback(() => {
        if (!product) return;
        setSelectedImage((prev) =>
            prev === 0 ? product.imageUrls.length - 1 : prev - 1
        );
    }, [product]);

    const handleNextImage = useCallback(() => {
        if (!product) return;
        setSelectedImage((prev) =>
            prev === product.imageUrls.length - 1 ? 0 : prev + 1
        );
    }, [product]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <Link href="/">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="h-96 w-full bg-muted rounded-xl animate-pulse" />
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="h-64 bg-muted rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <Link href="/">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                    <Card className="p-8">
                        <p className="text-center text-muted-foreground">
                            {error || 'Product not found'}
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <Link href="/">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Products
                    </Button>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="relative h-96 w-full bg-muted">
                                    {product.imageUrls.length > 0 && product.imageUrls[selectedImage] ? (
                                        <Image
                                            src={product.imageUrls[selectedImage]}
                                            alt={product.title}
                                            fill
                                            className="object-contain p-8"
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            priority
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            No image available
                                        </div>
                                    )}

                                    {/* Left/Right Arrow Navigation */}
                                    {product.imageUrls.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-colors cursor-pointer"
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-colors cursor-pointer"
                                                aria-label="Next image"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Thumbnails */}
                        {product.imageUrls.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {product.imageUrls.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative h-20 w-20 flex-shrink-0 border-2 rounded-lg overflow-hidden cursor-pointer transition-colors ${selectedImage === idx ? 'border-primary' : 'border-muted hover:border-primary/50'
                                            }`}
                                    >
                                        <Image
                                            src={url}
                                            alt={`${product.title} - Image ${idx + 1}`}
                                            fill
                                            className="object-contain p-2"
                                            sizes="80px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex gap-2 mb-2">
                                <Badge variant="secondary">{product.categoryName}</Badge>
                                <Badge variant="outline">{product.subCategoryName}</Badge>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                            <p className="text-sm text-muted-foreground">SKU: {product.retailerSku}</p>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary">
                                {formatPrice(product.retailPrice)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button size="lg" className="flex-1">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to Cart
                            </Button>
                            <Button size="lg" variant="outline">
                                <Heart className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Features */}
                        {product.featureBullets && product.featureBullets.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-semibold mb-3">Features</h2>
                                    <ul className="space-y-2">
                                        {product.featureBullets.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
