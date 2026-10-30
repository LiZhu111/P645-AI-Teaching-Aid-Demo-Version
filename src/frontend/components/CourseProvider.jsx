"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { requestAita } from '@/lib/aita-service';

const Context = createContext(null);
export function CourseProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedUnit, setUnitCode] = useState('DEMO101');
  const linkedUnit = searchParams.get('unit');
  const unitCode = linkedUnit && /^[A-Z0-9]{5,20}$/.test(linkedUnit) ? linkedUnit : selectedUnit;
  const [units, setUnits] = useState([]);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      requestAita('units', {}, controller.signal),
      requestAita('outline', { unit_code: unitCode }, controller.signal)
    ]).then(([available, outline]) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(available) || !Array.isArray(outline.reading_order)) throw new Error('Invalid course response.');
      setUnits(available);
      setUnitCode(outline.unit_code);
      setCourse({
        unit: { code: outline.unit_code, name: outline.name, label: outline.unit_code === 'DEMO101' ? 'demo course' : outline.unit_code },
        materials: outline.reading_order.map(item => ({ id: item.item_id, sequence: item.sequence, title: item.title, summary: item.title, text: [], keywords: [], criterion: outline.unit_code }))
      });
      setError('');
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [unitCode, attempt]);
  function selectUnit(code) { setCourse(null); setError(''); setUnitCode(code); router.replace(pathname); }
  const currentCourse = course?.unit.code === unitCode ? course : null;
  const loading = !currentCourse && !error;
  return <Context.Provider value={{ unit: currentCourse?.unit || { code: unitCode, name: 'Course', label: 'Course' }, materials: currentCourse?.materials || [], units, loading, error, selectUnit, retry: () => { setError(''); setAttempt(value => value + 1); } }}>{children}</Context.Provider>;
}
export function useCourse() { return useContext(Context); }

export function CourseStatus() {
  const { loading, error, retry } = useCourse();
  if (!loading && !error) return null;
  return <div role={error ? 'alert' : 'status'} className="m-5 rounded-lg border border-slate-200 bg-white p-5 lg:ml-[268px] lg:mr-5">
    {error || 'Loading course material…'}
    {error ? <button type="button" className="ml-4 underline" onClick={retry}>Retry</button> : null}
  </div>;
}
