export type PitchItem = { title: string; description: string };

/** Lista de tópicos com título e descrição, usada nos capítulos do pitch. */
export function PitchItemList({ items, className = "space-y-5" }: { items: PitchItem[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.title} className="space-y-2 border-t border-border pt-4">
          <h4 className="text-sm font-semibold">{item.title}</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}
