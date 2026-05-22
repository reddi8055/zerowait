import { MenuItemCard } from "@/components/ui/menu-item-card"; // Adjust the import path

const menuItems = [
  {
    imageUrl: "https://cdn.zeptonow.com/production/tr:w-403,ar-5078-5078,pr-true,f-auto,q-80/cms/product_variant/ecf42d53-e139-4643-91d7-3b75ddce5326.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    isVegetarian: true,
    name: "Strawberry Lemonade",
    price: 139,
    originalPrice: 279,
    quantity: "450 ml",
    prepTimeInMinutes: 5,
  },
  {
    imageUrl: "https://cdn.zeptonow.com/production/tr:w-403,ar-5304-5304,pr-true,f-auto,q-80/cms/product_variant/9bc896d4-229d-45a4-8294-b36f97f5992c.jpeg",
    isVegetarian: true,
    name: "Vietnamese Cold Coffee",
    price: 189,
    originalPrice: 529,
    quantity: "450 ml",
    prepTimeInMinutes: 5,
  },
  {
    imageUrl: "https://cdn.zeptonow.com/production/tr:w-403,ar-3618-3618,pr-true,f-auto,q-80/cms/product_variant/ea4bca48-a35d-4fa0-930a-c5bdc2d82695.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    isVegetarian: true,
    name: "Chole & Chapati",
    price: 149,
    originalPrice: 419,
    quantity: "Serves 1",
    prepTimeInMinutes: 5,
  },
  {
    imageUrl: "https://cdn.zeptonow.com/production/tr:w-403,ar-2400-2400,pr-true,f-auto,q-80/cms/product_variant/9d02200a-2335-4d38-b820-bbb9b4a1699c.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    isVegetarian: true,
    name: "Bhelpuri",
    price: 119,
    originalPrice: 229,
    quantity: "1 Portion",
    prepTimeInMinutes: 5,
  },
];

export default function MenuItemCardDemo() {
  const handleAddItem = (itemName) => {
    // In a real app, you'd add this to a cart state
    console.log(`Added ${itemName} to cart!`);
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 bg-background">
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {menuItems.map((item, index) => (
          <MenuItemCard
            key={index}
            imageUrl={item.imageUrl}
            isVegetarian={item.isVegetarian}
            name={item.name}
            price={item.price}
            originalPrice={item.originalPrice}
            quantity={item.quantity}
            prepTimeInMinutes={item.prepTimeInMinutes}
            onAdd={() => handleAddItem(item.name)}
          />
        ))}
      </div>
    </div>
  );
}
