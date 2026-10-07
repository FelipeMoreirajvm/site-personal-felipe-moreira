import type { ImageMetadata } from "astro";
import profileData from "../data/profile.json";
import photo from "../assets/felipe.jpeg";

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Profile {
  name: string;
  profession: string;
  bio: string;
  photo: ImageMetadata;
  photoAlt: string;
  skills: string[];
  socialLinks: SocialLink[];
}

function isSafeUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function getProfile(): Promise<Profile> {
  return {
    name: profileData.name,
    profession: profileData.profession,
    bio: profileData.bio,
    photo,
    photoAlt: profileData.photoAlt,
    skills: profileData.skills.filter((skill) => skill.trim() !== ""),
    socialLinks: profileData.socialLinks.filter((link) => isSafeUrl(link.url)),
  };
}