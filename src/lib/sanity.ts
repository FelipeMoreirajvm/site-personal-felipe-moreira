import { createClient } from "@sanity/client";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

// O Project ID não é segredo. O dataset do plano gratuito é público.
export const sanityClient = createClient({
  projectId: "h8t11d56",
  dataset: "production",
  apiVersion: "2025-01-01",
  // false: o site é gerado poucas vezes, então sempre busca o dado mais novo
  useCdn: false,
  // só o que foi publicado no painel, nunca rascunhos
  perspective: "published",
});

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}