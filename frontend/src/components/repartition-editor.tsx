"use client";

import type { RepartitionEtat } from "@/lib/missions";
import type { RepartitionTravauxCategorie } from "@/types";

// Répartition des travaux : pour chaque tâche, deux cases « Cabinet » et
// « Client » (les deux = tâche partagée, aucune = non applicable).
export function RepartitionEditor({
  catalogue,
  value,
  onChange,
}: {
  catalogue: RepartitionTravauxCategorie[];
  value: RepartitionEtat;
  onChange: (etat: RepartitionEtat) => void;
}) {
  function basculer(id: string, cote: "cabinet" | "client") {
    const actuel = value[id] ?? { cabinet: false, client: false };
    onChange({ ...value, [id]: { ...actuel, [cote]: !actuel[cote] } });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Cochez qui réalise chaque tâche : les deux cases = tâche partagée,
        aucune = non applicable.
      </p>
      {catalogue.map((cat) => (
        <div key={cat.titre} className="overflow-x-auto">
          <p className="mb-1 text-xs font-semibold text-slate-600">
            {cat.titre}
          </p>
          <table className="w-full min-w-[420px] text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-2 py-1.5 text-left font-semibold">Tâche</th>
                <th className="w-20 px-2 py-1.5 text-center font-semibold">
                  Cabinet
                </th>
                <th className="w-20 px-2 py-1.5 text-center font-semibold">
                  Client
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cat.lignes.map((ligne) => {
                const v = value[ligne.id] ?? { cabinet: false, client: false };
                return (
                  <tr key={ligne.id}>
                    <td className="px-2 py-1.5 text-slate-700">
                      {ligne.tache}
                    </td>
                    {(["cabinet", "client"] as const).map((cote) => (
                      <td key={cote} className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={v[cote]}
                          onChange={() => basculer(ligne.id, cote)}
                          aria-label={`${ligne.tache} — ${cote === "cabinet" ? "Cabinet" : "Client"}`}
                          className="size-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
