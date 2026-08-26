import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, encrypt, decrypt } from "./index";

describe("crypto", () => {
  it("hashPassword returns non-empty string", () => {
    expect(hashPassword("123456")).toBeTruthy();
    expect(typeof hashPassword("123456")).toBe("string");
  });

  it("hashPassword same input same output (deterministic)", () => {
    expect(hashPassword("abc")).toBe(hashPassword("abc"));
  });

  it("hashPassword different inputs different outputs", () => {
    expect(hashPassword("a")).not.toBe(hashPassword("b"));
  });

  it("verifyPassword correct", () => {
    const hash = hashPassword("mypass");
    expect(verifyPassword("mypass", hash)).toBe(true);
  });

  it("verifyPassword wrong", () => {
    const hash = hashPassword("mypass");
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("encrypt then decrypt roundtrip", () => {
    const text = "这是私密内容";
    const pwd = "key123";
    const encrypted = encrypt(text, pwd);
    expect(encrypted).not.toBe(text);
    expect(decrypt(encrypted, pwd)).toBe(text);
  });

  it("decrypt with wrong password returns empty", () => {
    const encrypted = encrypt("secret", "right");
    expect(decrypt(encrypted, "wrong")).toBe("");
  });
});
