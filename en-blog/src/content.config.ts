import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    primaryKeyword: z.string(),
    secondaryKeywords: z.array(z.string()),
    originalUrl: z.url(),
    author: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    lastReviewedAt: z.coerce.date().optional(),
    category: z.enum([
      'album-guides',
      'artists-listening',
      'practice-guides',
      'theory-voicings',
    ]),
    categoryLabel: z.string(),
    tags: z.array(z.string()),
    relatedSlugs: z.array(z.string()).length(3),
    ogImage: z.url(),
  }),
});

export const collections = { blog };
