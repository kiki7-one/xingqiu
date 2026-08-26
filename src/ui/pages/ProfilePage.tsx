import { useState, useEffect } from "react";
import { useStore } from "../../core/store/useStore";
import { updateProfile } from "../../core/store/profile";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";

export function ProfilePage() {
  const profile = useStore((s) => s.data.profile);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNickname(profile.nickname ?? "");
    setGender(profile.gender ?? "");
    setBirthday(profile.birthday ? profile.birthday.slice(0, 10) : "");
    setAvatar(profile.avatar ?? "");
  }, [profile]);

  const handleSave = async () => {
    await updateProfile({
      nickname: nickname.trim(),
      gender: gender || undefined,
      birthday: birthday || undefined,
      avatar,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">个人资料</h1>
      <div className="space-y-3 rounded-warm bg-white/70 p-4">
        <Input label="昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="你的昵称" />
        <Select label="性别" value={gender} onChange={(e) => setGender(e.target.value as any)} options={[
          { value: "", label: "不设置" },
          { value: "female", label: "女" },
          { value: "male", label: "男" },
          { value: "other", label: "其他" },
        ]} />
        <Input label="生日" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        <Input label="头像 URL（可选）" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="图片地址" />
        <Button onClick={handleSave}>保存</Button>
        {saved && <p className="text-xs text-sage-600">已保存</p>}
      </div>
    </div>
  );
}
