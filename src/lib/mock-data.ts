export const mockInsights = {
  overview: {
    followers: 12543,
    followersGrowth: 234,
    reach: 45200,
    reachChange: 12.5,
    impressions: 89300,
    impressionsChange: 8.3,
    engagement: 4.8,
    engagementChange: 0.7,
    profileViews: 3420,
    websiteClicks: 187,
  },
  followerGrowth: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    followers: 12000 + Math.floor(Math.random() * 600) + i * 20,
  })),
  topPosts: [
    {
      id: "1",
      imageUrl: "https://picsum.photos/seed/post1/400/400",
      likes: 1243,
      comments: 87,
      engagement: 6.2,
    },
    {
      id: "2",
      imageUrl: "https://picsum.photos/seed/post2/400/400",
      likes: 982,
      comments: 64,
      engagement: 5.8,
    },
    {
      id: "3",
      imageUrl: "https://picsum.photos/seed/post3/400/400",
      likes: 876,
      comments: 52,
      engagement: 5.1,
    },
    {
      id: "4",
      imageUrl: "https://picsum.photos/seed/post4/400/400",
      likes: 754,
      comments: 41,
      engagement: 4.7,
    },
    {
      id: "5",
      imageUrl: "https://picsum.photos/seed/post5/400/400",
      likes: 623,
      comments: 38,
      engagement: 4.3,
    },
    {
      id: "6",
      imageUrl: "https://picsum.photos/seed/post6/400/400",
      likes: 512,
      comments: 29,
      engagement: 3.9,
    },
  ],
  bestPostingTimes: [
    { day: "Mon", hour: 9, score: 85 },
    { day: "Mon", hour: 12, score: 92 },
    { day: "Mon", hour: 18, score: 78 },
    { day: "Tue", hour: 10, score: 88 },
    { day: "Tue", hour: 14, score: 95 },
    { day: "Tue", hour: 19, score: 82 },
    { day: "Wed", hour: 11, score: 90 },
    { day: "Wed", hour: 15, score: 87 },
    { day: "Wed", hour: 20, score: 75 },
    { day: "Thu", hour: 9, score: 83 },
    { day: "Thu", hour: 13, score: 91 },
    { day: "Thu", hour: 17, score: 86 },
    { day: "Fri", hour: 10, score: 94 },
    { day: "Fri", hour: 14, score: 89 },
    { day: "Fri", hour: 19, score: 80 },
    { day: "Sat", hour: 11, score: 96 },
    { day: "Sat", hour: 15, score: 93 },
    { day: "Sat", hour: 20, score: 88 },
    { day: "Sun", hour: 12, score: 91 },
    { day: "Sun", hour: 16, score: 85 },
    { day: "Sun", hour: 21, score: 79 },
  ],
  recentActivity: [
    {
      id: "1",
      type: "like",
      user: "fashionista_jane",
      post: "Summer Collection Launch",
      time: "2 minutes ago",
    },
    {
      id: "2",
      type: "comment",
      user: "travel_with_mike",
      post: "10 Hidden Gems in Bali",
      text: "Amazing tips! Can't wait to visit!",
      time: "5 minutes ago",
    },
    {
      id: "3",
      type: "follow",
      user: "tech_guru_dev",
      time: "12 minutes ago",
    },
    {
      id: "4",
      type: "mention",
      user: "fitness_fanatic",
      post: "Morning Workout Routine",
      time: "1 hour ago",
    },
    {
      id: "5",
      type: "share",
      user: "foodie_adventures",
      post: "Best Coffee Shops in NYC",
      time: "2 hours ago",
    },
  ],
};

export const mockOccasions = [
  { id: "new-year", name: "New Year", emoji: "🎉", category: "holiday" },
  { id: "valentines", name: "Valentine's Day", emoji: "❤️", category: "holiday" },
  { id: "easter", name: "Easter", emoji: "🐰", category: "holiday" },
  { id: "independence", name: "Independence Day", emoji: "🇺🇸", category: "holiday" },
  { id: "halloween", name: "Halloween", emoji: "🎃", category: "holiday" },
  { id: "thanksgiving", name: "Thanksgiving", emoji: "🦃", category: "holiday" },
  { id: "christmas", name: "Christmas", emoji: "🎄", category: "holiday" },
  { id: "graduation", name: "Graduation", emoji: "🎓", category: "milestone" },
  { id: "birthday", name: "Birthday", emoji: "🎂", category: "milestone" },
  { id: "anniversary", name: "Anniversary", emoji: "🥂", category: "milestone" },
  { id: "black-friday", name: "Black Friday", emoji: "🛍️", category: "sales" },
  { id: "cyber-monday", name: "Cyber Monday", emoji: "💻", category: "sales" },
  { id: "summer", name: "Summer", emoji: "☀️", category: "seasonal" },
  { id: "winter", name: "Winter", emoji: "❄️", category: "seasonal" },
  { id: "spring", name: "Spring", emoji: "🌸", category: "seasonal" },
  { id: "fall", name: "Fall", emoji: "🍂", category: "seasonal" },
];

export const mockCaptionTemplates = [
  {
    id: "business",
    name: "Business Professional",
    tone: "professional",
    template:
      "Elevate your business with strategic insights that drive real results. Our latest blog post breaks down the key strategies successful entrepreneurs use to scale their ventures.",
  },
  {
    id: "lifestyle",
    name: "Lifestyle Inspiration",
    tone: "inspirational",
    template:
      "Live your best life, one moment at a time. Today's reminder: every small step counts towards your bigger picture. What's your next move?",
  },
  {
    id: "food",
    name: "Food & Recipe",
    tone: "casual",
    template:
      "Ready to elevate your cooking game? This easy-to-follow recipe will have your taste buds dancing! Save this post for later and tag a friend who needs to try this.",
  },
  {
    id: "fitness",
    name: "Fitness Motivation",
    tone: "motivational",
    template:
      "Your only competition is the person you were yesterday. Push through the discomfort and embrace the growth. Drop a 💪 if you're ready to crush your goals today!",
  },
];

export const quickReplies = [
  { id: "pricing", label: "Pricing Info", message: "Our products start at $29. Would you like to see our full catalog?" },
  { id: "shipping", label: "Shipping Details", message: "We offer free shipping on orders over $50! Standard delivery takes 3-5 business days." },
  { id: "returns", label: "Return Policy", message: "We have a 30-day return policy. Items must be unused with tags attached." },
  { id: "hours", label: "Business Hours", message: "We're available Monday-Friday, 9 AM - 6 PM EST. We'll respond to messages within 24 hours!" },
  { id: "discount", label: "Current Discounts", message: "Use code INSTA20 for 20% off your first order! Valid until end of month." },
];
