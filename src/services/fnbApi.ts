// Layanan Integrasi External API FnB (Food & Beverage)

// ============================================================================
// 1. INTERFACE: Menentukan bentuk & struktur Object menu FnB dari External API
// ============================================================================
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  isAvailable: boolean;
  description: string;
  icon: string;
}

// ============================================================================
// 2. ASYNC FUNCTION: Custom & Pre-built Async Function
//    - Custom Async Function: 'fetchFnBProducts' (dibuat dengan kata kunci async)
//    - Pre-built Async Function: 'fetch()' & 'response.json()' bawaan JavaScript
// ============================================================================
export const fetchFnBProducts = async (): Promise<Product[]> => {
  try {
    // Memanggil Pre-built Async Function bawaan JS untuk mengambil data FnB
    const response = await fetch('https://dummyjson.com/recipes?limit=10');
    const data = await response.json(); // Pre-built async function

    // Memasukkan data ke dalam Object menggunakan Interface Product
    const apiProducts: Product[] = data.recipes.map((item: any) => {
      // Menentukan kategori FnB (Makanan atau Snack)
      const isDessertOrSnack =
        item.mealType?.includes('Snack') ||
        item.mealType?.includes('Dessert') ||
        item.mealType?.includes('Appetizer');

      const productObj: Product = {
        id: `fnb-${item.id}`,
        name: item.name,
        category: isDessertOrSnack ? 'Snack' : 'Makanan',
        price: (item.caloriesPerServing || 250) * 100, // Estimasi harga (misal: 300 kkal = Rp 30.000)
        cost: Math.round(((item.caloriesPerServing || 250) * 100) * 0.5),
        stock: 25,
        isAvailable: true,
        description: `Kuliner ${item.cuisine || 'International'}. Kalori: ${item.caloriesPerServing} kcal. Rating: ⭐ ${item.rating}`,
        icon: 'restaurant-outline',
      };

      return productObj;
    });

    // Menambahkan menu Minuman FnB agar pilihan kategori minuman di Kasir tetap lengkap
    const drinkProducts: Product[] = [
      {
        id: 'fnb-drink-1',
        name: 'Iced Lemon Tea Segar',
        category: 'Minuman',
        price: 15000,
        cost: 6000,
        stock: 30,
        isAvailable: true,
        description: 'Teh melati dingin dengan perasan buah lemon segar',
        icon: 'cafe-outline',
      },
      {
        id: 'fnb-drink-2',
        name: 'Caramel Cold Brew Coffee',
        category: 'Minuman',
        price: 24000,
        cost: 10000,
        stock: 20,
        isAvailable: true,
        description: 'Kopi seduh dingin dengan sirup karamel lembut',
        icon: 'cafe-outline',
      },
      {
        id: 'fnb-drink-3',
        name: 'Matcha Green Tea Latte',
        category: 'Minuman',
        price: 22000,
        cost: 9000,
        stock: 25,
        isAvailable: true,
        description: 'Matcha Jepang asli dengan susu segar creamy',
        icon: 'cafe-outline',
      },
    ];

    return [...apiProducts, ...drinkProducts];
  } catch (error) {
    console.error('Error saat mengambil data dari External API FnB:', error);
    return [];
  }
};

