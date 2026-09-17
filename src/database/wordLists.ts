export const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
  'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
  'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Margaret', 'Mark', 'Betty', 'Donald', 'Sandra',
  'Steven', 'Ashley', 'Paul', 'Dorothy', 'Andrew', 'Kimberly', 'Joshua', 'Emily', 'Kenneth', 'Donna',
  'Kevin', 'Michelle', 'Brian', 'Carol', 'George', 'Amanda', 'Timothy', 'Melissa', 'Ronald', 'Deborah',
  'Edward', 'Stephanie', 'Jason', 'Rebecca', 'Jeffrey', 'Sharon', 'Ryan', 'Laura', 'Jacob', 'Cynthia',
  'Amara', 'Wei', 'Priya', 'Hiroshi', 'Fatima', 'Diego', 'Yuki', 'Amina', 'Sofia', 'Kwame',
  'Elena', 'Raj', 'Mei', 'Omar', 'Ingrid', 'Lucas', 'Nadia', 'Kenji', 'Zara', 'Mateus',
]

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Chen', 'Kim', 'Patel', 'Kumar', 'Okafor', 'Tanaka', 'Andersson', 'Kowalski', 'Rossi', 'Muller',
  'Silva', 'Costa', 'Ivanov', 'Petrov', 'Haddad', 'Mansour', 'Osei', 'Mensah', 'Larsen', 'Nilsson',
]

export const COUNTRIES: { country: string; cities: string[] }[] = [
  { country: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Austin', 'Seattle', 'Denver'] },
  { country: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol'] },
  { country: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
  { country: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse'] },
  { country: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'] },
  { country: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] },
  { country: 'Japan', cities: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya'] },
  { country: 'Brazil', cities: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Salvador'] },
  { country: 'India', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'] },
  { country: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville'] },
  { country: 'Netherlands', cities: ['Amsterdam', 'Rotterdam', 'Utrecht'] },
  { country: 'Sweden', cities: ['Stockholm', 'Gothenburg', 'Malmo'] },
  { country: 'Poland', cities: ['Warsaw', 'Krakow', 'Wroclaw'] },
  { country: 'Mexico', cities: ['Mexico City', 'Guadalajara', 'Monterrey'] },
  { country: 'South Korea', cities: ['Seoul', 'Busan', 'Incheon'] },
  { country: 'Italy', cities: ['Rome', 'Milan', 'Naples'] },
  { country: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban'] },
  { country: 'Singapore', cities: ['Singapore'] },
  { country: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi'] },
  { country: 'Nigeria', cities: ['Lagos', 'Abuja'] },
]

export const STREET_NAMES = [
  'Maple', 'Oak', 'Cedar', 'Elm', 'Pine', 'Washington', 'Lake', 'Hill', 'Park', 'Sunset',
  'River', 'Main', 'Church', 'High', 'Union', 'Market', 'Willow', 'Spring', 'Chestnut', 'Meadow',
]

export const DEPARTMENTS: { name: string; parent: string | null }[] = [
  { name: 'Executive', parent: null },
  { name: 'Sales', parent: 'Executive' },
  { name: 'Sales - Enterprise', parent: 'Sales' },
  { name: 'Sales - SMB', parent: 'Sales' },
  { name: 'Engineering', parent: 'Executive' },
  { name: 'Engineering - Platform', parent: 'Engineering' },
  { name: 'Engineering - Mobile', parent: 'Engineering' },
  { name: 'Customer Success', parent: 'Executive' },
  { name: 'Support - Tier 1', parent: 'Customer Success' },
  { name: 'Support - Tier 2', parent: 'Customer Success' },
  { name: 'Marketing', parent: 'Executive' },
  { name: 'Operations', parent: 'Executive' },
  { name: 'Warehouse Operations', parent: 'Operations' },
]

export const CATEGORY_TREE: { name: string; children: string[] }[] = [
  { name: 'Electronics', children: ['Laptops & Computers', 'Smartphones', 'Audio', 'Cameras', 'Wearables'] },
  { name: 'Home & Kitchen', children: ['Furniture', 'Cookware', 'Small Appliances', 'Decor'] },
  { name: 'Sports & Outdoors', children: ['Fitness Equipment', 'Camping', 'Cycling', 'Team Sports'] },
  { name: 'Fashion', children: ['Men’s Clothing', 'Women’s Clothing', 'Footwear', 'Accessories'] },
  { name: 'Beauty & Personal Care', children: ['Skincare', 'Haircare', 'Fragrance'] },
  { name: 'Toys & Games', children: ['Board Games', 'Building Sets', 'Outdoor Toys'] },
  { name: 'Books', children: ['Fiction', 'Non-Fiction', 'Children’s Books'] },
  { name: 'Office Supplies', children: ['Stationery', 'Office Furniture', 'Organization'] },
]

export const PRODUCT_ADJECTIVES = [
  'Premium', 'Compact', 'Wireless', 'Ergonomic', 'Portable', 'Classic', 'Pro', 'Ultra', 'Eco',
  'Deluxe', 'Essential', 'Modern', 'Rugged', 'Lightweight', 'Smart', 'Vintage', 'Adjustable', 'Foldable',
]

export const PRODUCT_NOUNS: Record<string, string[]> = {
  'Laptops & Computers': ['Laptop', 'Ultrabook', 'Mini PC', 'Monitor Stand', 'Docking Station'],
  Smartphones: ['Smartphone', 'Phone Case', 'Screen Protector', 'Power Bank'],
  Audio: ['Headphones', 'Earbuds', 'Bluetooth Speaker', 'Soundbar', 'Microphone'],
  Cameras: ['Digital Camera', 'Action Camera', 'Tripod', 'Camera Bag'],
  Wearables: ['Smartwatch', 'Fitness Tracker', 'Smart Ring'],
  Furniture: ['Office Chair', 'Standing Desk', 'Bookshelf', 'Sofa', 'Coffee Table'],
  Cookware: ['Frying Pan', 'Saucepan Set', 'Knife Set', 'Cutting Board'],
  'Small Appliances': ['Blender', 'Toaster', 'Coffee Maker', 'Air Fryer', 'Electric Kettle'],
  Decor: ['Table Lamp', 'Wall Clock', 'Area Rug', 'Throw Pillow'],
  'Fitness Equipment': ['Yoga Mat', 'Dumbbell Set', 'Resistance Bands', 'Treadmill'],
  Camping: ['Tent', 'Sleeping Bag', 'Camping Stove', 'Backpack'],
  Cycling: ['Road Bike', 'Bike Helmet', 'Bike Lock', 'Bike Light'],
  'Team Sports': ['Soccer Ball', 'Basketball', 'Tennis Racket', 'Gym Bag'],
  'Men’s Clothing': ['Denim Jacket', 'Chino Pants', 'Wool Sweater', 'Dress Shirt'],
  'Women’s Clothing': ['Maxi Dress', 'Blazer', 'Yoga Pants', 'Blouse'],
  Footwear: ['Running Shoes', 'Leather Boots', 'Sandals', 'Sneakers'],
  Accessories: ['Leather Belt', 'Sunglasses', 'Wallet', 'Tote Bag'],
  Skincare: ['Face Serum', 'Moisturizer', 'Sunscreen', 'Cleanser'],
  Haircare: ['Shampoo', 'Hair Dryer', 'Hair Straightener'],
  Fragrance: ['Eau de Parfum', 'Cologne', 'Scented Candle'],
  'Board Games': ['Strategy Board Game', 'Card Game', 'Puzzle'],
  'Building Sets': ['Building Block Set', 'Model Kit'],
  'Outdoor Toys': ['Kite', 'Water Blaster', 'Bubble Machine'],
  Fiction: ['Novel', 'Short Story Collection', 'Graphic Novel'],
  'Non-Fiction': ['Biography', 'Cookbook', 'History Book'],
  'Children’s Books': ['Picture Book', 'Activity Book'],
  Stationery: ['Notebook Set', 'Pen Set', 'Sticky Notes'],
  'Office Furniture': ['Filing Cabinet', 'Desk Organizer', 'Ergonomic Chair'],
  Organization: ['Storage Bin Set', 'Drawer Organizer', 'Label Maker'],
}

export const BRANDS = [
  'Norvex', 'Kestrel', 'BlueOak', 'Vantage', 'Cirrus', 'Halcyon', 'Meridian', 'Solace', 'Fenwick',
  'Arclight', 'Novaterra', 'Brightline', 'Cascadia', 'Ironclad', 'Lumino', 'Northbound', 'Aurelia',
  'Pinepoint', 'Redwood Co.', 'Silverbrook',
]

export const EVENT_TYPES = [
  'page_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'search',
  'begin_checkout', 'purchase', 'wishlist_add', 'coupon_applied', 'signup', 'login',
]

export const TICKET_SUBJECTS = [
  'Order has not arrived', 'Wrong item received', 'Request for refund', 'Product arrived damaged',
  'Cannot apply coupon code', 'Question about return policy', 'Payment charged twice',
  'Need to change shipping address', 'Product is missing parts', 'How do I cancel my membership?',
  'Tracking number not working', 'Item different from description', 'Request to update account email',
  'Late delivery complaint', 'Warranty claim', 'Difficulty resetting password',
]
