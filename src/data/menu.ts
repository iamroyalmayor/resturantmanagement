export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  vegetarian?: boolean;
  spicy?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Grilled Salmon',
    description: 'Fresh salmon fillet with lemon butter sauce',
    price: 28,
    category: 'Main Course',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with homemade caesar dressing',
    price: 12,
    category: 'Appetizers',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    rating: 4.6,
    vegetarian: true,
  },
  {
    id: '3',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with vanilla ice cream',
    price: 8,
    category: 'Desserts',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    rating: 4.9,
    vegetarian: true,
  },
  {
    id: '4',
    name: 'Pasta Carbonara',
    description: 'Authentic Italian pasta with bacon and cream sauce',
    price: 16,
    category: 'Main Course',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    rating: 4.7,
  },
  {
    id: '5',
    name: 'Iced Tea',
    description: 'Refreshing homemade iced tea',
    price: 3,
    category: 'Beverages',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    rating: 4.4,
    vegetarian: true,
  },
  {
    id: '6',
    name: 'Bruschetta',
    description: 'Toasted bread with tomatoes and basil',
    price: 7,
    category: 'Appetizers',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    rating: 4.5,
    vegetarian: true,
  },
];
