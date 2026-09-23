import { Component, useEffect, useRef, useState } from 'react';
import { getTemplate } from '../../templates/templateRegistry';
import { hasText } from '../../utils/text';
import '../../templates/templateStyles.css';

export function Preview({ resume }) {
  const frameRef = useRef(null);
  const pageRef = useRef(null);
  const [scale, setScale] = useState(0.72);
  const [pageHeight, setPageHeight] = useState(1056);
  const template = getTemplate(resume?.templateId);
  const Sheet = template.Component;

  useEffect(() => {
    const frame = frameRef.current;
    const page = pageRef.current;
    if (!frame || !page) return undefined;

    const measure = () => {
      const width = page.offsetWidth || 816;
      const available = Math.max(frame.clientWidth - 8, 260);
      setScale(Math.min(1, available / width));
      setPageHeight(page.offsetHeight || 1056);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(page);
    return () => observer.disconnect();
  }, [resume]);

  return (
    <div className="flex h-full min-h-[70vh] flex-col">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Live preview</p>
          <p className="mt-1 text-sm text-ink">
            {template.name} · {template.font}
          </p>
        </div>
        {!hasText(resume?.contact?.name) && (
          <p className="text-xs text-accent">Add a name in Contact.</p>
        )}
      </div>
      <div
        ref={frameRef}
        className="max-h-[calc(100vh-7.5rem)] flex-1 overflow-auto rounded-3xl border border-line/80 bg-[linear-gradient(180deg,#e7e0d4_0%,#efe8dc_100%)] p-4 shadow-inner"
      >
        <div className="mx-auto flex justify-center" style={{ height: Math.max(pageHeight * scale, 280) }}>
          <div style={{ width: 816 * scale, height: pageHeight * scale }}>
            <div
              ref={pageRef}
              className="shadow-sheet"
              style={{ width: 816, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
              <PreviewBoundary>
                <Sheet resume={resume} />
              </PreviewBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

class PreviewBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <article className="resume-page rs-classic-1">
          <p>Preview could not render this draft. Check the form and try again.</p>
        </article>
      );
    }
    return this.props.children;
  }
}
