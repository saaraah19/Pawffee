import type { Metadata } from "next";
import PawIcon from "@/components/PawIcon";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Pawffee.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <PawIcon size={20} className="mb-5 text-paw" />
      <p className="label-eyebrow">About</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">
        A little about the kitchen
      </h1>
      <div className="prose-recipe mt-6 space-y-5 text-[1.05rem] leading-relaxed text-coffee">
        <p>
          Pawffee started as a stack of handwritten notes tucked into a
          kitchen drawer — recipes copied from grandmothers, adapted after a
          few failed attempts, and occasionally invented out of necessity on
          a slow Sunday.
        </p>
        <p>
          This site is that drawer, tidied up. Every recipe here has actually
          been made, more than once, in a real kitchen, usually with a cat
          sitting somewhere it probably shouldn&apos;t be. Nothing gets
          published until it&apos;s been tested enough times to trust.
        </p>
        <p>
          There&apos;s no comment section, no ratings, no sign-up. Just
          recipes, written the way I&apos;d want to read them myself: clear
          measurements, honest timings, and a few personal notes about what
          actually matters when you&apos;re standing at the stove.
        </p>
        <p>Thanks for stopping by — I hope something here earns a place in your own kitchen.</p>
      </div>
    </div>
  );
}
