/**
 * kiki星球 核心类型定义
 * 对应 PRD v2.1.0 第五章实体
 */

// ============ 通用 ============

export type ID = string;
export type ISODateString = string; // ISO 8601

export interface BaseEntity {
  id: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  isDeleted?: boolean;
}

// ============ 用户资料 ============

export interface Profile {
  nickname: string;
  avatar: string; // 本地图片路径或 base64
  gender?: "male" | "female" | "other";
  birthday?: ISODateString;
}

// ============ 物品 ============

export type ItemCategory =
  | "daily" // 日用
  | "food" // 食品
  | "cleaning" // 清洁
  | "personal_care" // 个护
  | "pet_supplies" // 宠物用品
  | "other";

export interface Item extends BaseEntity {
  name: string;
  category: ItemCategory;
  stock: number;
  unit: string;
  location?: string;
  expireDate?: ISODateString;
  threshold?: number; // 预警阈值
  images?: string[];
  remark?: string;
}

export interface ConsumptionRecord extends BaseEntity {
  itemId: ID;
  quantity: number; // 正数补充，负数消耗
  recordTime: ISODateString;
  remark?: string;
}

export interface ShoppingListItem extends BaseEntity {
  name: string;
  quantity?: number;
  source: "reminder" | "manual";
  status: "pending" | "purchased";
  purchasedQuantity?: number;
}

// ============ 宠物 ============

export type PetSpecies = "cat" | "dog" | "other";
export type PetGender = "male" | "female";

export interface Pet extends BaseEntity {
  name: string;
  species: PetSpecies;
  breed?: string;
  birthday?: ISODateString;
  weight?: number; // kg
  photos?: string[];
  furColor?: string;
  gender?: PetGender;
  isSterilized?: boolean;
}

export type ReminderType =
  | "vaccine"
  | "deworming_internal"
  | "deworming_external"
  | "health_custom"
  | "cat_litter"
  | "food";

export interface PetReminder extends BaseEntity {
  petId: ID;
  type: ReminderType;
  title: string;
  lastDate?: ISODateString;
  cycleDays?: number; // 周期天数
  nextDate?: ISODateString; // 下次提醒日期（可推算或手动）
  vaccineName?: string; // 疫苗名称
  dewormingType?: "internal" | "external"; // 驱虫类型
  remark?: string;
  lastTriggeredAt?: ISODateString;
  enabled: boolean;
}

export interface PetFood extends BaseEntity {
  petId: ID;
  totalWeight: number; // 录入重量 kg
  dailyConsumption: number; // 每日消耗克数
  recordDate: ISODateString; // 录入日期
}

// 粮食余量等级
export type FoodLevel = "sufficient" | "moderate" | "low" | "empty";

// ============ 待办 ============

export type TodoPriority = "high" | "medium" | "low";
export type RepeatRule =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

export interface Todo extends BaseEntity {
  title: string;
  priority: TodoPriority;
  deadline?: ISODateString;
  repeatRule: RepeatRule;
  customRepeatDays?: number; // 自定义周期天数
  category?: string;
  remark?: string;
  isCompleted: boolean;
  completedAt?: ISODateString;
}

// ============ 日记 ============

export type Mood = "happy" | "calm" | "sad" | "angry" | "tired";
export type Weather = "sunny" | "cloudy" | "rainy" | "snowy" | "overcast";

export interface Diary extends BaseEntity {
  date: ISODateString; // YYYY-MM-DD
  content: string;
  images?: string[];
  mood?: Mood;
  weather?: Weather;
  tags?: string[];
}

// ============ 记账 ============

export type TransactionType = "income" | "expense";
export type TransactionCategory =
  | "food"
  | "transport"
  | "pet"
  | "daily"
  | "entertainment"
  | "other";

export interface Transaction extends BaseEntity {
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  date: ISODateString; // YYYY-MM-DD
  remark?: string;
}

export interface Budget {
  month: string; // YYYY-MM
  total?: number;
  byCategory?: Partial<Record<TransactionCategory, number>>;
}

// ============ 内容收藏 ============

export interface QuoteFavorite extends BaseEntity {
  quoteId: string;
  text: string;
  category?: string;
}

export interface FlowerFavorite extends BaseEntity {
  flowerId: string;
  name: string;
}

// ============ 设置 ============

export interface ReminderSettings {
  globalEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  perType: Partial<Record<ReminderType | "todo" | "shopping", boolean>>;
  deduplicationHours: number; // 同事项去重小时数，默认 24
}

export interface AutoBackupSettings {
  enabled: boolean;
  frequency: "weekly" | "daily" | "monthly";
  directory?: string;
}

export interface PrivacySettings {
  enabled: boolean;
  passwordHash?: string; // PBKDF2 hash
  protectedModules: string[]; // ["diary", "transaction", "pet"]
}

export interface Settings {
  reminders: ReminderSettings;
  autoBackup: AutoBackupSettings;
  privacy: PrivacySettings;
}

// ============ 离线内容 ============

export interface Quote {
  id: string;
  text: string;
  category: "motivational" | "healing" | "love" | "friendship";
}

export interface Flower {
  id: string;
  name: string;
  meaning: string;
  imageUrl: string;
  careTips?: string;
}

// ============ 数据文件根结构 ============

export interface KikiData {
  version: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  profile: Profile;
  settings: Settings;
  items: Item[];
  consumptionRecords: ConsumptionRecord[];
  shoppingList: ShoppingListItem[];
  pets: Pet[];
  petReminders: PetReminder[];
  petFoods: PetFood[];
  todos: Todo[];
  diaries: Diary[];
  transactions: Transaction[];
  budgets: Budget[];
  quoteFavorites: QuoteFavorite[];
  flowerFavorites: FlowerFavorite[];
  contentOverrides: {
    quotes: Quote[];
    flowers: Flower[];
  };
}
