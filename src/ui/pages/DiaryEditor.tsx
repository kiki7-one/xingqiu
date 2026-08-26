import { useState, useEffect } from "react";
import { addDiary, updateDiary, deleteDiary } from "../../core/store/diaries";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { todayDate } from "../../core/utils/id";
import type { Diary, Mood, Weather } from "../../core/types";

const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: "happy", label: "开心" },
  { value: "calm", label: "平静" },
  { value: "sad", label: "难过" },
  { value: "angry", label: "愤怒" },
  { value: "tired", label: "疲惫" },
];

const WEATHER_OPTIONS: { value: Weather; label: string }[] = [
  { value: "sunny", label: "晴" },
  { value: "cloudy", label: "多云" },
  { value: "rainy", label: "雨" },
  { value: "snowy", label: "雪" },
  { value: "overcast", label: "阴" },
];

export function DiaryEditor({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Diary | null;
}) {
  const [date, setDate] = useState(todayDate());
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | "">("");
  const [weather, setWeather] = useState<Weather | "">("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDate(editing.date);
      setContent(editing.content);
      setMood(editing.mood ?? "");
      setWeather(editing.weather ?? "");
      setTagsInput((editing.tags ?? []).join(", "));
    } else {
      setDate(todayDate());
      setContent("");
      setMood("");
      setWeather("");
      setTagsInput("");
    }
    setError("");
  }, [open, editing]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("日记内容不能为空");
      return;
    }
    if (content.length > 5000) {
      setError("日记内容不能超过 5000 字");
      return;
    }
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      date,
      content: content.trim(),
      mood: (mood || undefined) as Mood | undefined,
      weather: (weather || undefined) as Weather | undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
    if (editing) {
      await updateDiary(editing.id, payload);
    } else {
      await addDiary(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (confirm("确定删除这篇日记吗？")) {
      await deleteDiary(editing.id);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "编辑日记" : "写日记"}
      footer={
        <>
          {editing && (
            <Button variant="danger" onClick={handleDelete}>
              删除
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>保存</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="日期"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Textarea
          label="内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="记录今天的故事..."
          error={error ? error : undefined}
        />
        <div className="flex gap-2">
          <Select
            label="心情"
            value={mood}
            onChange={(e) => setMood(e.target.value as Mood | "")}
            options={[{ value: "", label: "不选" }, ...MOOD_OPTIONS]}
            className="flex-1"
          />
          <Select
            label="天气"
            value={weather}
            onChange={(e) => setWeather(e.target.value as Weather | "")}
            options={[{ value: "", label: "不选" }, ...WEATHER_OPTIONS]}
            className="flex-1"
          />
        </div>
        <Input
          label="标签（逗号分隔）"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="如：生活, 旅行"
        />
      </div>
    </Modal>
  );
}
