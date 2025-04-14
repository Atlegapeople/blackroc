import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
}

interface ProductsSectionProps {
  products?: Product[];
}

const ProductsSection = ({
  products = defaultProducts,
}: ProductsSectionProps) => {
  return (
    <section className="py-16 px-4 bg-champagne-800">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-2 text-jet-500">Our Products</h2>
          <p className="text-jet-600 max-w-2xl mx-auto">
            We offer a wide range of high-quality construction aggregates to
            meet your project needs.
          </p>
        </motion.div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="sands">Sands</TabsTrigger>
              <TabsTrigger value="stone">Stone</TabsTrigger>
              <TabsTrigger value="mix">Builders Mix</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-8">
            <ProductGrid products={products} />
          </TabsContent>

          <TabsContent value="sands" className="space-y-8">
            <ProductGrid
              products={products.filter((p) => p.category === "sands")}
            />
          </TabsContent>

          <TabsContent value="stone" className="space-y-8">
            <ProductGrid
              products={products.filter((p) => p.category === "stone")}
            />
          </TabsContent>

          <TabsContent value="mix" className="space-y-8">
            <ProductGrid
              products={products.filter((p) => p.category === "mix")}
            />
          </TabsContent>

          <TabsContent value="other" className="space-y-8">
            <ProductGrid
              products={products.filter((p) => p.category === "other")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

const ProductGrid = ({ products }: { products: Product[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden h-full bg-white shadow-md border border-champagne-400">
        <div className="h-48 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold text-jet-500">
              {product.name}
            </h3>
            <Badge variant="outline" className="bg-champagne-600 text-jet-500">
              {product.category}
            </Badge>
          </div>
          <p className="text-jet-600 mb-4">{product.description}</p>
          <Button
            variant="outline"
            className="w-full border-buff-500 text-jet-500 hover:bg-buff-500 hover:text-white"
          >
            Request Quote
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Building Sand",
    description:
      "High-quality building sand perfect for general construction and masonry work.",
    category: "sands",
    imageUrl: "/src/images/buildingsand.jpg",
  },
  {
    id: "2",
    name: "River Sand",
    description:
      "Natural river sand that is washed and screened for various construction applications.",
    category: "sands",
    imageUrl:
            "/src/images/riversand.jpg",
  },
  {
    id: "3",
    name: "Plaster Sand",
    description:
      "Fine-grained sand specifically formulated for plastering and rendering.",
    category: "sands",
    imageUrl:
          "/src/images/plasteringsand.jpg",
  },
  {
    id: "4",
    name: "19mm Stone",
    description:
      "Medium-sized crushed stone aggregate ideal for concrete mixing and drainage.",
    category: "stone",
    imageUrl:
      "/src/images/19mmstone.jpg",
  },
  {
    id: "5",
    name: "13mm Stone",
    description:
      "Smaller crushed stone perfect for detailed concrete work and surfacing.",
    category: "stone",
    imageUrl:
      "/src/images/13mmstone.jpg",
  },
  {
    id: "6",
    name: "Builders Mix",
    description:
      "Pre-mixed combination of sand and stone ready for concrete applications.",
    category: "mix",
    imageUrl:
      "/src/images/buildersmix.jpg",
  },
  {
    id: "7",
    name: "G5 Material",
    description:
      "Crushed stone material suitable for road base and sub-base construction.",
    category: "other",
    imageUrl:
      "/src/images/g5material.jpg",
  },
  {
    id: "8",
    name: "Gabion Rock",
    description:
      "Large stone pieces used for gabion baskets and retaining wall structures.",
    category: "other",
    imageUrl:
      "/src/images/gabionrock.jpg",
  },
  {
    id: "9",
    name: "Double Washed Plaster",
    description: "Premium washed plaster sand for high-quality finishing work.",
    category: "sands",
    imageUrl:
      "/src/images/doublewashedplaster.png",
  },
];

export default ProductsSection;
