import { useState, useEffect } from "react";
import { Plus, Cat, Dog, PawPrint, Trash2 } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  addPet,
  updatePet,
  deletePet,
  addPetReminder,
  updatePetReminder,
  deletePetReminder,
  calculateNextDate,
  addPetFood,
  getFoodLevel,
  FoodLevelLabel,
  calculateFoodRatio,
} from "../../core/store/pets";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { BackButton } from "../components/BackButton";
import type {
  Pet,
  PetSpecies,
  PetGender,
  ReminderType,
  PetReminder,
} from "../../core/types";

const SPECIES_OPTIONS: { value: PetSpecies; label: string }[] = [
  { value: "cat", label: "猫" },
  { value: "dog", label: "狗" },
  { value: "other", label: "其他" },
];

const SPECIES_ICON: Record<PetSpecies, typeof Cat> = {
  cat: Cat,
  dog: Dog,
  other: PawPrint,
};

export function PetsPage() {
  const pets = useStore((s) => s.data.pets.filter((p) => !p.isDeleted));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [activePetId, setActivePetId] = useState<string>("");

  // 默认选中第一只
  useEffect(() => {
    if (!activePetId && pets.length > 0) {
      setActivePetId(pets[0].id);
    }
  }, [pets, activePetId]);

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (pet: Pet) => {
    setEditing(pet);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定删除该宠物吗？相关提醒将一并禁用。")) {
      await deletePet(id);
      if (activePetId === id) setActivePetId("");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/record" />
          <h1 className="text-2xl font-bold text-cream-900">宠物</h1>
        </div>
        <Button onClick={handleAdd} variant="icon" aria-label="新增">
          <Plus size={16} />
        </Button>
      </div>

      {pets.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {pets.map((pet) => {
            const Icon = SPECIES_ICON[pet.species];
            return (
              <button
                key={pet.id}
                onClick={() => setActivePetId(pet.id)}
                className={`flex min-w-[80px] flex-col items-center gap-1 rounded-warm p-2 transition-colors ${
                  pet.id === activePet?.id
                    ? "bg-cream-200"
                    : "bg-white/60 hover:bg-cream-100"
                }`}
              >
                <Icon size={24} className="text-cream-600" />
                <span className="text-xs text-cream-800">{pet.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {pets.length === 0 ? (
        <Empty
          icon={<PawPrint size={48} />}
          message="还没有宠物档案"
          hint="点击右上角新增你的宠物"
        />
      ) : activePet ? (
        <PetDetail
          pet={activePet}
          onEdit={() => handleEdit(activePet)}
          onDelete={() => handleDelete(activePet.id)}
        />
      ) : null}

      <PetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  );
}

function PetDetail({
  pet,
  onEdit,
  onDelete,
}: {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const food = useStore((s) =>
    s.data.petFoods.find((f) => f.petId === pet.id)
  );
  const reminders = useStore((s) =>
    s.data.petReminders.filter((r) => r.petId === pet.id && r.enabled)
  );

  return (
    <div className="space-y-4">
      <div className="rounded-warm bg-white/70 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-cream-900">{pet.name}</h2>
            <p className="mt-1 text-xs text-cream-600">
              {pet.species === "cat" ? "猫" : pet.species === "dog" ? "狗" : "其他"}
              {pet.breed ? ` · ${pet.breed}` : ""}
              {pet.gender ? ` · ${pet.gender === "male" ? "公" : "母"}` : ""}
              {pet.weight ? ` · ${pet.weight}kg` : ""}
              {pet.isSterilized ? " · 已绝育" : ""}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="rounded bg-cream-100 px-2 py-1 text-sm text-cream-700 hover:bg-cream-200"
            >
              编辑
            </button>
            <button
              onClick={onDelete}
              className="rounded bg-red-100 px-2 py-1 text-sm text-red-600 hover:bg-red-200"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <PetFoodCard petId={pet.id} food={food} />

      <PetRemindersCard petId={pet.id} reminders={reminders} />
    </div>
  );
}

function PetFoodCard({
  petId,
  food,
}: {
  petId: string;
  food?: import("../../core/types").PetFood;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [totalWeight, setTotalWeight] = useState("");
  const [dailyConsumption, setDailyConsumption] = useState("");

  useEffect(() => {
    if (modalOpen && food) {
      setTotalWeight(String(food.totalWeight));
      setDailyConsumption(String(food.dailyConsumption));
    } else if (modalOpen) {
      setTotalWeight("");
      setDailyConsumption("");
    }
  }, [modalOpen, food]);

  const level = food ? getFoodLevel(food) : null;
  const ratio = food ? calculateFoodRatio(food) : null;

  const handleSave = async () => {
    const tw = Number(totalWeight);
    const dc = Number(dailyConsumption);
    if (tw > 0 && dc > 0) {
      await addPetFood({
        petId,
        totalWeight: tw,
        dailyConsumption: dc,
        recordDate: new Date().toISOString(),
      });
      setModalOpen(false);
    }
  };

  return (
    <div className="rounded-warm bg-white/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-cream-800">粮食余量</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs text-cream-600 underline"
        >
          {food ? "更新" : "录入"}
        </button>
      </div>
      {level ? (
        <div className="mt-2">
          <span
            className={`rounded px-2 py-1 text-sm font-medium ${
              level === "sufficient"
                ? "bg-green-100 text-green-700"
                : level === "moderate"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {FoodLevelLabel[level]}
          </span>
          <p className="mt-1 text-xs text-cream-500">
            剩余约 {Math.round(ratio! * 100)}%
          </p>
        </div>
      ) : (
        <p className="mt-1 text-xs text-cream-500">未录入</p>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="录入粮食"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="录入重量 (kg)"
            type="number"
            value={totalWeight}
            onChange={(e) => setTotalWeight(e.target.value)}
          />
          <Input
            label="每日消耗 (g)"
            type="number"
            value={dailyConsumption}
            onChange={(e) => setDailyConsumption(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

function PetFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Pet | null;
}) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<PetSpecies>("cat");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<PetGender | "">("");
  const [birthday, setBirthday] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [furColor, setFurColor] = useState("");
  const [isSterilized, setIsSterilized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setSpecies(editing.species);
      setBreed(editing.breed ?? "");
      setGender(editing.gender ?? "");
      setBirthday(editing.birthday ?? "");
      setWeight(editing.weight ?? "");
      setFurColor(editing.furColor ?? "");
      setIsSterilized(editing.isSterilized ?? false);
    } else {
      setName("");
      setSpecies("cat");
      setBreed("");
      setGender("");
      setBirthday("");
      setWeight("");
      setFurColor("");
      setIsSterilized(false);
    }
    setError("");
  }, [open, editing]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("宠物名字不能为空");
      return;
    }
    const payload = {
      name: name.trim(),
      species,
      breed: breed || undefined,
      gender: gender || undefined,
      birthday: birthday || undefined,
      weight: weight === "" ? undefined : Number(weight),
      furColor: furColor || undefined,
      isSterilized,
    };
    if (editing) {
      await updatePet(editing.id, payload);
    } else {
      await addPet(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "编辑宠物" : "新增宠物"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>保存</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="名字"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error && !name ? error : undefined}
        />
        <Select
          label="种类"
          value={species}
          onChange={(e) => setSpecies(e.target.value as PetSpecies)}
          options={SPECIES_OPTIONS}
        />
        <Input
          label="品种"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="如：英短"
        />
        <Select
          label="性别"
          value={gender}
          onChange={(e) => setGender(e.target.value as PetGender | "")}
          options={[
            { value: "", label: "请选择" },
            { value: "male", label: "公" },
            { value: "female", label: "母" },
          ]}
        />
        <Input
          label="生日"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
        <Input
          label="体重 (kg)"
          type="number"
          value={weight}
          onChange={(e) =>
            setWeight(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
        <Input
          label="毛色"
          value={furColor}
          onChange={(e) => setFurColor(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-cream-800">
          <input
            type="checkbox"
            checked={isSterilized}
            onChange={(e) => setIsSterilized(e.target.checked)}
          />
          已绝育
        </label>
      </div>
    </Modal>
  );
}

const REMINDER_TYPE_OPTIONS: { value: ReminderType; label: string }[] = [
  { value: "vaccine", label: "疫苗" },
  { value: "deworming_internal", label: "驱虫（体内）" },
  { value: "deworming_external", label: "驱虫（体外）" },
  { value: "health_custom", label: "健康（自定义）" },
  { value: "cat_litter", label: "猫砂更换" },
  { value: "food", label: "粮食" },
];

const REMINDER_TYPE_LABEL: Record<ReminderType, string> = {
  vaccine: "疫苗",
  deworming_internal: "驱虫（体内）",
  deworming_external: "驱虫（体外）",
  health_custom: "健康（自定义）",
  cat_litter: "猫砂更换",
  food: "粮食",
};

function PetRemindersCard({
  petId,
  reminders,
}: {
  petId: string;
  reminders: PetReminder[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PetReminder | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (r: PetReminder) => {
    setEditing(r);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定删除该提醒吗？")) {
      await deletePetReminder(id);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-cream-800">提醒事项</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus size={14} className="mr-1" /> 添加
        </Button>
      </div>
      {reminders.length === 0 ? (
        <p className="text-xs text-cream-500">暂无提醒</p>
      ) : (
        <ul className="space-y-1">
          {reminders.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded bg-white/60 p-2"
            >
              <button
                onClick={() => handleEdit(r)}
                className="flex-1 text-left text-sm text-cream-800"
                aria-label={`编辑${r.title}提醒`}
              >
                <span className="font-medium">{r.title}</span>
                <span className="ml-2 rounded bg-cream-100 px-1.5 py-0.5 text-xs text-cream-600">
                  {REMINDER_TYPE_LABEL[r.type]}
                </span>
                {r.cycleDays && (
                  <span className="ml-2 text-xs text-cream-500">
                    {`每${r.cycleDays}天`}
                  </span>
                )}
                {r.nextDate && (
                  <span className="ml-2 text-xs text-cream-500">
                    {`下次: ${r.nextDate.slice(0, 10)}`}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="ml-2 text-red-400 hover:text-red-600"
                aria-label={`删除${r.title}提醒`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <PetReminderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        petId={petId}
        editing={editing}
      />
    </div>
  );
}

function PetReminderModal({
  open,
  onClose,
  petId,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  petId: string;
  editing: PetReminder | null;
}) {
  const [type, setType] = useState<ReminderType>("vaccine");
  const [title, setTitle] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [cycleDays, setCycleDays] = useState<string>("30");
  const [nextDate, setNextDate] = useState("");
  const [vaccineName, setVaccineName] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setTitle(editing.title);
      setLastDate(editing.lastDate ? editing.lastDate.slice(0, 10) : "");
      setCycleDays(editing.cycleDays ? String(editing.cycleDays) : "30");
      setNextDate(editing.nextDate ? editing.nextDate.slice(0, 10) : "");
      setVaccineName(editing.vaccineName ?? "");
      setRemark(editing.remark ?? "");
    } else {
      setType("vaccine");
      setTitle("");
      setLastDate("");
      setCycleDays("30");
      setNextDate("");
      setVaccineName("");
      setRemark("");
    }
    setError("");
  }, [open, editing]);

  // 当有上次日期 + 周期时，自动推算下次日期
  useEffect(() => {
    if (open && lastDate && cycleDays) {
      const calculated = calculateNextDate(
        new Date(lastDate).toISOString(),
        Number(cycleDays)
      );
      setNextDate(calculated.slice(0, 10));
    }
  }, [open, lastDate, cycleDays]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("提醒标题不能为空");
      return;
    }
    const payload = {
      petId,
      type,
      title: title.trim(),
      lastDate: lastDate ? new Date(lastDate).toISOString() : undefined,
      cycleDays: cycleDays ? Number(cycleDays) : undefined,
      nextDate: nextDate ? new Date(nextDate).toISOString() : undefined,
      vaccineName: type === "vaccine" ? vaccineName || undefined : undefined,
      remark: remark || undefined,
      enabled: true,
    };
    if (editing) {
      await updatePetReminder(editing.id, payload);
    } else {
      await addPetReminder(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "编辑提醒" : "添加提醒"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>保存</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Select
          label="类型"
          value={type}
          onChange={(e) => setType(e.target.value as ReminderType)}
          options={REMINDER_TYPE_OPTIONS}
        />
        <Input
          label="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error ? error : undefined}
          placeholder="如：猫三联疫苗"
        />
        {type === "vaccine" && (
          <Input
            label="疫苗名称"
            value={vaccineName}
            onChange={(e) => setVaccineName(e.target.value)}
            placeholder="如：猫三联"
          />
        )}
        <Input
          label="上次日期"
          type="date"
          value={lastDate}
          onChange={(e) => setLastDate(e.target.value)}
        />
        <Input
          label="周期（天）"
          type="number"
          min="1"
          value={cycleDays}
          onChange={(e) => setCycleDays(e.target.value)}
        />
        <Input
          label="下次提醒日期"
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          placeholder="根据上次日期+周期自动推算"
        />
        <Textarea
          label="备注"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
        />
      </div>
    </Modal>
  );
}
