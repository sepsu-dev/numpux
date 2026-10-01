import { Check, Columns, Flag } from "@phosphor-icons/react/dist/ssr";

export function VisualShowcase() {
  return (
    <section className="border-y border-border bg-white py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-3">
        {[
          [Columns, "See the whole board", "Check every stage without opening another view."],
          [Flag, "Keep priorities visible", "Mark urgent work without turning the board into a wall of color."],
          [Check, "Close the loop", "Move finished work to done and keep the next step clear."],
        ].map(([Icon, title, text]) => {
          const ItemIcon = Icon as typeof Check;
          return (
            <div key={title as string} className="border-l border-border pl-5">
              <ItemIcon size={18} className="text-primary" />
              <h3 className="mt-4 text-sm font-semibold">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text as string}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
