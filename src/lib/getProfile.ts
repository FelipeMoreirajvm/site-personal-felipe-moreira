import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient, urlFor } from "./sanity";

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ProfilePhoto {
  src: string;
  srcset: string;
  alt: string;
}

export interface Profile {
  name: string;
  profession: string;
  bio: string;
  photo: ProfilePhoto;
  socialLinks: SocialLink[];
}

interface ProfileDocument {
  name?: string;
  profession?: string;
  bio?: string;
  photo?: SanityImageSource;
  photoAlt?: string;
  hasPhoto?: boolean;
  socialLinks?: { platform?: string; url?: string }[];
}

const PROFILE_QUERY = `*[_type == "profile"][0]{
  name,
  profession,
  bio,
  photo,
  "photoAlt": photo.alt,
  "hasPhoto": defined(photo.asset),
  socialLinks
}`;

// Ordem fixa das redes na tela. Nomes em minúsculas.
// Redes que não estão na lista vão para o fim, na ordem do painel.
const SOCIAL_ORDER = ["whatsapp", "instagram", "linkedin", "github", "discord"];

function socialRank(link: SocialLink): number {
  const index = SOCIAL_ORDER.indexOf(link.platform.trim().toLowerCase());
  return index === -1 ? SOCIAL_ORDER.length : index;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function getProfile(): Promise<Profile> {
  const data = await sanityClient.fetch<ProfileDocument | null>(PROFILE_QUERY);

  if (!data?.name || !data.profession || !data.bio || !data.photo || !data.hasPhoto) {
    throw new Error(
      'Perfil incompleto no Sanity. Abra o painel, preencha todos os campos de "Início (perfil)" e clique em Publish.',
    );
  }

  const name = data.name;

  const socialLinks: SocialLink[] = (data.socialLinks ?? [])
    .flatMap((link) =>
      link.platform && link.url && isHttpsUrl(link.url)
        ? [{ platform: link.platform, url: link.url }]
        : [],
    )
    .sort((a, b) => socialRank(a) - socialRank(b));

  const photoUrl = (width: number) =>
    urlFor(data.photo as SanityImageSource)
      .width(width)
      .height(width)
      .fit("crop")
      .auto("format")
      .url();

  return {
    name,
    profession: data.profession,
    bio: data.bio,
    photo: {
      src: photoUrl(560),
      srcset: `${photoUrl(560)} 560w, ${photoUrl(1120)} 1120w`,
      alt: data.photoAlt?.trim() || `Retrato de ${name}`,
    },
    socialLinks,
  };
}