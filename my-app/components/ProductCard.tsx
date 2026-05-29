import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function ProductCard() {
  return (
    <Card className="w-72">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mechanical Keyboard</CardTitle>
          <Badge>In Stock</Badge>
        </div>
        <CardDescription>TKL layout, Cherry MX switches</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">₹4,999</p>
        <p className="text-sm text-muted-foreground mt-1">
          Free delivery by Friday
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">Add to Cart</Button>
        <Button variant="outline">Wishlist</Button>
      </CardFooter>
    </Card>
  );
}
