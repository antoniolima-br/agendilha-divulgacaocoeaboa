import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AttractionScheduleAssessment = "safe" | "conflict" | "unknown";

export type AttractionScheduleEntry = {
  event_id: string;
  event_start: string;
  event_end: string | null;
  assessment: AttractionScheduleAssessment;
};

export type AttractionScheduleInput = {
  attractionId?: string | null;
  attractionType?: "artist" | "atrativo" | null;
  attractionName?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  excludeSubmissionId?: string | null;
};

export async function checkAttractionSchedule(input: AttractionScheduleInput) {
  const attractionName = input.attractionName?.trim();
  const date = input.date?.trim();
  const startTime = input.startTime?.trim();
  if (!attractionName || !date || !startTime) return [];

  const { data, error } = await supabase.rpc("check_attraction_schedule", {
    p_atrativo_id: (input.attractionType === "atrativo" ? input.attractionId : null) as unknown as string,
    p_artist_id: (input.attractionType === "artist" ? input.attractionId : null) as unknown as string,
    p_atrativo_name: attractionName,
    p_date: date,
    p_start_time: startTime,
    p_end_time: input.endTime?.trim() || undefined,
    p_exclude_submission_id: (input.excludeSubmissionId || undefined) as string | undefined,
  });
  if (error) throw error;
  return (data ?? []) as AttractionScheduleEntry[];
}

export function useAttractionSchedule(input: AttractionScheduleInput) {
  const [entries, setEntries] = useState<AttractionScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const attractionName = input.attractionName?.trim();
    const date = input.date?.trim();
    const startTime = input.startTime?.trim();
    if (!attractionName || !date || !startTime) {
      setEntries([]);
      setLoading(false);
      setFailed(false);
      return () => { active = false; };
    }

    setLoading(true);
    setFailed(false);
    const timer = window.setTimeout(() => {
      void checkAttractionSchedule(input)
        .then((next) => {
          if (active) setEntries(next);
        })
        .catch(() => {
          if (active) {
            setEntries([]);
            setFailed(true);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [input.attractionId, input.attractionName, input.attractionType, input.date, input.endTime, input.excludeSubmissionId, input.startTime]);

  const hasConflict = useMemo(() => entries.some((entry) => entry.assessment === "conflict"), [entries]);
  return { entries, loading, failed, hasConflict };
}