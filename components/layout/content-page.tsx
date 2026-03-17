import Link from 'next/link';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ContentSection = {
  title: string;
  description?: string;
  body?: string[];
  bullets?: string[];
};

type ContentPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: ContentSection[];
  primaryCta?: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
};

export default function ContentPage({
  eyebrow,
  title,
  description,
  sections,
  primaryCta,
  secondaryCta,
}: ContentPageProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <section className="px-4 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance">{title}</h1>
              <p className="text-lg text-muted-foreground">{description}</p>
              {(primaryCta || secondaryCta) && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {primaryCta && (
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href={primaryCta.href}>{primaryCta.label}</Link>
                    </Button>
                  )}
                  {secondaryCta && (
                    <Button asChild variant="outline">
                      <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.title} className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && <CardDescription>{section.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.body?.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-6 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
