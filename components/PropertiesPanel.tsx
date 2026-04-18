'use client';

import { useState, useEffect, useRef } from 'react';

export interface ElementProps {
  tag: string;
  classes: string;
  text: string;
  hint: string | null;
  styles: {
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    textAlign: string;
    letterSpacing: string;
    lineHeight: string;
    borderRadius: string;
    maxWidth: string;
    minHeight: string;
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
  };
  specific?: {
    src?: string;
    alt?: string;
    href?: string;
    target?: string;
    text?: string;
    poster?: string;
    value?: string;
    placeholder?: string;
  };
}

interface Props {
  element: ElementProps;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onApplyToCode: (prompt: string) => void;
  onClose: () => void;
}

function pxNum(v: string) { return parseInt(v, 10) || 0; }
function numPx(v: number | string) { return typeof v === 'number' ? v + 'px' : v; }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white"
      >
        <span>{title}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function SpinnerInput({ label, value, unit = 'px', onChange }: { label: string; value: string; unit?: string; onChange: (v: string) => void }) {
  const num = pxNum(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center bg-gray-700 rounded px-2 py-1 gap-1">
        <input
          type="number"
          value={num}
          onChange={e => onChange(e.target.value + unit)}
          className="w-10 bg-transparent text-xs text-white outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-gray-400 text-[10px]">{unit}</span>
        <div className="flex flex-col ml-auto">
          <button onClick={() => onChange((num + 1) + unit)} className="text-gray-400 hover:text-white leading-none text-[10px]">▲</button>
          <button onClick={() => onChange((num - 1) + unit)} className="text-gray-400 hover:text-white leading-none text-[10px]">▼</button>
        </div>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-2 bg-gray-700 rounded px-2 py-1">
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={e => onChange(e.target.value)}
          className="w-6 h-5 bg-transparent border-none outline-none cursor-pointer rounded"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white outline-none font-mono min-w-0"
        />
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-700 rounded px-2 py-1 text-xs text-white outline-none w-full"
      />
    </div>
  );
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-700 rounded px-2 py-1 text-xs text-white outline-none w-full"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function PropertiesPanel({ element, iframeRef, onApplyToCode, onClose }: Props) {
  const [styles, setStyles] = useState({ ...element.styles });
  const [specific, setSpecific] = useState({ ...element.specific });
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when a new element is selected
  useEffect(() => {
    setStyles({ ...element.styles });
    setSpecific({ ...element.specific });
  }, [element]);

  // Live-apply style changes to the iframe with debounce
  function applyStyle(patch: Partial<typeof styles>) {
    const next = { ...styles, ...patch };
    setStyles(next);
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'inspector:apply-style',
        styles: {
          fontSize:        next.fontSize,
          fontFamily:      next.fontFamily,
          fontWeight:      next.fontWeight,
          color:           next.color,
          backgroundColor: next.backgroundColor === 'transparent' ? '' : next.backgroundColor,
          textAlign:       next.textAlign,
          letterSpacing:   next.letterSpacing,
          lineHeight:      next.lineHeight,
          borderRadius:    next.borderRadius,
          marginTop:       next.marginTop,
          marginRight:     next.marginRight,
          marginBottom:    next.marginBottom,
          marginLeft:      next.marginLeft,
          paddingTop:      next.paddingTop,
          paddingRight:    next.paddingRight,
          paddingBottom:   next.paddingBottom,
          paddingLeft:     next.paddingLeft,
        }
      }, '*');
    }, 80);
  }

  function applySrc(src: string) {
    setSpecific(prev => ({ ...prev, src }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'inspector:apply-src', src }, '*');
  }

  function applyHref(href: string, target?: string) {
    setSpecific(prev => ({ ...prev, href, target: target ?? prev?.target ?? '_self' }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'inspector:apply-href', href, target: target ?? specific?.target ?? '_self' }, '*');
  }

  function applyText(text: string) {
    setSpecific(prev => ({ ...prev, text }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'inspector:apply-text', text }, '*');
  }

  function buildAIPrompt() {
    const label = element.hint ? `"${element.hint}"` : `<${element.tag}>`;
    const parts: string[] = [`Update the ${label} element:`];

    // Element-specific changes
    if (element.tag === 'img' && specific?.src !== element.specific?.src) {
      parts.push(`- Change image src to: ${specific?.src}`);
      if (specific?.alt !== element.specific?.alt) parts.push(`- Change alt text to: "${specific?.alt}"`);
    }
    if (element.tag === 'a') {
      if (specific?.href !== element.specific?.href) parts.push(`- Change link href to: ${specific?.href}`);
      if (specific?.target !== element.specific?.target) parts.push(`- Change link target to: ${specific?.target}`);
    }
    if (element.tag === 'video' && specific?.src !== element.specific?.src) {
      parts.push(`- Change video src to: ${specific?.src}`);
    }

    // Style changes
    const styleChanges: string[] = [];
    const s = styles;
    const o = element.styles;
    if (s.color !== o.color) styleChanges.push(`color: ${s.color}`);
    if (s.backgroundColor !== o.backgroundColor) styleChanges.push(`background-color: ${s.backgroundColor}`);
    if (s.fontSize !== o.fontSize) styleChanges.push(`font-size: ${s.fontSize}`);
    if (s.fontFamily !== o.fontFamily) styleChanges.push(`font-family: ${s.fontFamily}`);
    if (s.fontWeight !== o.fontWeight) styleChanges.push(`font-weight: ${s.fontWeight}`);
    if (s.textAlign !== o.textAlign) styleChanges.push(`text-align: ${s.textAlign}`);
    if (s.letterSpacing !== o.letterSpacing) styleChanges.push(`letter-spacing: ${s.letterSpacing}`);
    if (s.borderRadius !== o.borderRadius) styleChanges.push(`border-radius: ${s.borderRadius}`);
    if (s.marginTop !== o.marginTop || s.marginRight !== o.marginRight || s.marginBottom !== o.marginBottom || s.marginLeft !== o.marginLeft) {
      styleChanges.push(`margin: ${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`);
    }
    if (s.paddingTop !== o.paddingTop || s.paddingRight !== o.paddingRight || s.paddingBottom !== o.paddingBottom || s.paddingLeft !== o.paddingLeft) {
      styleChanges.push(`padding: ${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`);
    }
    if (styleChanges.length > 0) parts.push('- Apply these styles: ' + styleChanges.join(', '));

    if (parts.length === 1) return `Edit the ${label} element: `;
    return parts.join('\n');
  }

  const tag = element.tag;
  const isImg = tag === 'img';
  const isLink = tag === 'a';
  const isVideo = tag === 'video' || tag === 'iframe';

  return (
    <div className="absolute top-0 right-0 w-52 h-full bg-gray-800 border-l border-gray-700 flex flex-col z-20 overflow-y-auto text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
            {element.hint || `<${tag}>`}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm leading-none">✕</button>
      </div>

      {/* Element-specific: Image */}
      {isImg && (
        <Section title="Image">
          <div className="space-y-2">
            <TextInput label="Source URL" value={specific?.src || ''} onChange={applySrc} placeholder="https://..." />
            <TextInput label="Alt text" value={specific?.alt || ''} onChange={v => setSpecific(p => ({ ...p, alt: v }))} />
            {specific?.src && (
              <img src={specific.src} alt="preview" className="w-full h-20 object-cover rounded mt-1 border border-gray-600" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </div>
        </Section>
      )}

      {/* Element-specific: Link */}
      {isLink && (
        <Section title="Link">
          <div className="space-y-2">
            <TextInput label="URL" value={specific?.href || ''} onChange={v => applyHref(v, specific?.target)} placeholder="https://..." />
            <SelectInput label="Target" value={specific?.target || '_self'} options={['_self', '_blank', '_parent', '_top']} onChange={v => applyHref(specific?.href || '', v)} />
            <TextInput label="Link text" value={specific?.text || ''} onChange={applyText} />
          </div>
        </Section>
      )}

      {/* Element-specific: Video */}
      {isVideo && (
        <Section title={tag === 'video' ? 'Video' : 'Embed'}>
          <div className="space-y-2">
            <TextInput label="Source URL" value={specific?.src || ''} onChange={applySrc} placeholder="https://..." />
            {tag === 'video' && (
              <TextInput label="Poster image" value={specific?.poster || ''} onChange={v => { setSpecific(p => ({ ...p, poster: v })); }} placeholder="https://..." />
            )}
          </div>
        </Section>
      )}

      {/* Typography */}
      <Section title="Typography">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <SelectInput
              label="Font family"
              value={styles.fontFamily}
              options={['Arial','Georgia','Helvetica','Inter','Lato','Montserrat','Open Sans','Oswald','Playfair Display','Roboto','system-ui','Times New Roman','Verdana']}
              onChange={v => applyStyle({ fontFamily: v })}
            />
          </div>
          <SpinnerInput label="Font size" value={styles.fontSize} onChange={v => applyStyle({ fontSize: v })} />
          <SelectInput label="Font weight" value={styles.fontWeight} options={['100','200','300','400','500','600','700','800','900','normal','bold']} onChange={v => applyStyle({ fontWeight: v })} />
          <SelectInput label="Text align" value={styles.textAlign} options={['left','center','right','justify']} onChange={v => applyStyle({ textAlign: v })} />
          <TextInput label="Line height" value={styles.lineHeight} onChange={v => applyStyle({ lineHeight: v })} />
          <TextInput label="Letter spacing" value={styles.letterSpacing} onChange={v => applyStyle({ letterSpacing: v })} />
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors">
        <div className="space-y-2">
          <ColorInput label="Color" value={styles.color} onChange={v => applyStyle({ color: v })} />
          <ColorInput label="Background" value={styles.backgroundColor} onChange={v => applyStyle({ backgroundColor: v })} />
        </div>
      </Section>

      {/* Size */}
      <Section title="Size">
        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Max width" value={styles.maxWidth} onChange={v => applyStyle({ maxWidth: v })} placeholder="auto" />
          <TextInput label="Min height" value={styles.minHeight} onChange={v => applyStyle({ minHeight: v })} placeholder="auto" />
          <TextInput label="Border radius" value={styles.borderRadius} onChange={v => applyStyle({ borderRadius: v })} />
        </div>
      </Section>

      {/* Margin */}
      <Section title="Margin">
        <div className="grid grid-cols-2 gap-2">
          <SpinnerInput label="Top"    value={styles.marginTop}    onChange={v => applyStyle({ marginTop: v })} />
          <SpinnerInput label="Right"  value={styles.marginRight}  onChange={v => applyStyle({ marginRight: v })} />
          <SpinnerInput label="Bottom" value={styles.marginBottom} onChange={v => applyStyle({ marginBottom: v })} />
          <SpinnerInput label="Left"   value={styles.marginLeft}   onChange={v => applyStyle({ marginLeft: v })} />
        </div>
      </Section>

      {/* Padding */}
      <Section title="Padding">
        <div className="grid grid-cols-2 gap-2">
          <SpinnerInput label="Top"    value={styles.paddingTop}    onChange={v => applyStyle({ paddingTop: v })} />
          <SpinnerInput label="Right"  value={styles.paddingRight}  onChange={v => applyStyle({ paddingRight: v })} />
          <SpinnerInput label="Bottom" value={styles.paddingBottom} onChange={v => applyStyle({ paddingBottom: v })} />
          <SpinnerInput label="Left"   value={styles.paddingLeft}   onChange={v => applyStyle({ paddingLeft: v })} />
        </div>
      </Section>

      {/* Apply to Code */}
      <div className="p-3 flex-shrink-0 mt-auto sticky bottom-0 bg-gray-800 border-t border-gray-700">
        <button
          onClick={() => onApplyToCode(buildAIPrompt())}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          Apply to Code
        </button>
        <p className="text-[10px] text-gray-500 text-center mt-1">Saves changes permanently via AI</p>
      </div>
    </div>
  );
}
