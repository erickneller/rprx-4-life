import { writeFileSync } from 'fs';
import jsPDFMod, { jsPDF } from 'jspdf';
const OrigCtor: any = jsPDF;
function Patched(this: any, ...args: any[]) {
  const inst = new OrigCtor(...args);
  inst.save = function(){
    writeFileSync('/tmp/preview.pdf', Buffer.from(this.output('arraybuffer')));
    console.log('SAVED');
    return this;
  };
  return inst;
}
Patched.prototype = OrigCtor.prototype;
// @ts-ignore
(await import('jspdf')).jsPDF = Patched as any;
// Override the module export cache - simpler: patch globalThis
(globalThis as any).__jsPDFCtor = Patched;

// Now import planExport but force-replace its jsPDF reference via require cache trick — instead easier: just call its functions but intercept via setTimeout? 
// Simplest: instead of intercepting, make planExport return doc when in test. Skip — write a wrapper.

// Fallback: directly replicate the call with a wrapped doc by importing planExport's internal builders is not exposed.
// Solution: temporarily edit planExport to also expose a build function returning doc. Skip for now and just re-do the export by saving from output('blob') replacement.

// Brand-new strategy: patch the module's own jsPDF via replacing its export getter.
const planMod: any = await import('./lib/planExport');
console.log('keys', Object.keys(planMod));
