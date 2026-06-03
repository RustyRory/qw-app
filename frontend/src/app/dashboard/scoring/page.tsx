"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { apiFetch } from "@/lib/apiFetch";
import { RiskBadge } from "@/lib/status";
import type { Client, RiskScore } from "@/types";

interface ClientWithScore extends Client {
  latestScore?: RiskScore;
}

export default function ScoringPage() {
  const [items, setItems] = useState<ClientWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    apiFetch<Client[]>("/clients")
      .then(async (clients) => {
        const results = await Promise.allSettled(
          clients.map((c) =>
            apiFetch<RiskScore[]>(`/scoring/${c.id}`).then((scores) => ({
              ...c,
              latestScore: scores[0],
            })),
          ),
        );
        setItems(
          results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const withScore = items.filter((i) => i.latestScore);
  const filtered =
    filter === "all"
      ? withScore
      : withScore.filter((i) => i.latestScore?.niveau === filter);

  const chartData = [
    {
      name: "Faible",
      value: withScore.filter((i) => i.latestScore?.niveau === "faible").length,
      fill: "#22c55e",
    },
    {
      name: "Moyen",
      value: withScore.filter((i) => i.latestScore?.niveau === "moyen").length,
      fill: "#eab308",
    },
    {
      name: "Élevé",
      value: withScore.filter((i) => i.latestScore?.niveau === "eleve").length,
      fill: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Scoring des risques</h1>

      {!loading && chartData.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Répartition par niveau</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { value: "all", label: "Tous" },
          { value: "faible", label: "Faible" },
          { value: "moyen", label: "Moyen" },
          { value: "eleve", label: "Élevé" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Client
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Niveau
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Score
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Calculé le
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chargement…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucune donnée
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/clients/${item.id}`}
                      className="hover:underline"
                    >
                      {item.prenom} {item.nom}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={item.latestScore!.niveau} />
                  </td>
                  <td className="px-4 py-3">{item.latestScore!.score}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(
                      item.latestScore!.calculatedAt,
                    ).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
