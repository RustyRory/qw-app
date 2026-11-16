"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { AcceptationForm } from "@/components/acceptation-form";

export default function AcceptationProspectPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-full bg-slate-50 pb-20 md:pb-8">
      <header className="border-b bg-white px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href={`/dashboard/prospects/${id}`}
            aria-label="Retour au prospect"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <IconArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Prospect
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              Acceptation et choix de la mission
            </h1>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:px-8">
        <AcceptationForm cible="prospect" cibleId={id} />
      </div>
    </div>
  );
}
