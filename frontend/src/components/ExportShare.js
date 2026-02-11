'use client';

import { useState } from 'react';
import { Share2, FileText, Send, Link, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTranslatedCropName } from '../lib/crops';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ExportShare({ targetId, title, data }) {
    const { t } = useTranslation();
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);

    const exportPDF = async () => {
        const element = document.getElementById(targetId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const styleTag = clonedDoc.createElement('style');
                    styleTag.innerHTML = `
                        * { 
                            -webkit-print-color-adjust: exact !important; 
                        }
                        /* Fallback colors for html2canvas */
                        .bg-brand-green { background-color: #10b981 !important; }
                        .text-brand-green { color: #10b981 !important; }
                        .bg-brand-dark { background-color: #022c22 !important; }
                        .text-brand-dark { color: #022c22 !important; }
                        .glass-panel, .glass-card { background-color: rgba(255, 255, 255, 0.9) !important; }
                    `;
                    clonedDoc.head.appendChild(styleTag);

                    // Aggressively strip modern CSS color functions that html2canvas cannot parse
                    const allElements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < allElements.length; i++) {
                        const el = allElements[i];
                        const style = clonedDoc.defaultView.getComputedStyle(el);

                        const props = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
                        props.forEach(prop => {
                            const val = style.getPropertyValue(prop);
                            if (val.includes('lab') || val.includes('oklch') || val.includes('oklab') || val.includes('lch')) {
                                if (prop === 'background-color') {
                                    el.style.backgroundColor = '#ffffff';
                                } else if (prop === 'color') {
                                    el.style.color = '#000000';
                                } else {
                                    el.style.setProperty(prop, 'transparent', 'important');
                                }
                            }
                        });
                    }
                }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error('PDF Export failed:', err);
        }
    };

    const shareToTelegram = () => {
        let text = `${t('share.shareMessage')}\n\n${title}`;

        const cropLabel = getTranslatedCropName(t, data?.crop_name || data?.crop) || '---';
        // Custom templates based on context
        if (title.includes('Irrigation') || title.includes('Sug\'orish')) {
            text = `🌱 Salom! Bu mening ${new Date().getFullYear()}-yilgi sug'orish jadvalim.\nFarmMind Lite orqali yaratdim.\n\n${title}\nEkin: ${cropLabel}\nHudud: ${data?.region || '---'}\n\nNima deb o'ylaysiz?`;
        } else if (title.includes('Market') || title.includes('Bozor')) {
            text = `📢 Sotiladi: ${cropLabel}\nNarxi: ${data?.price} so'm/kg\nHudud: ${data?.region}\n\nQo'ng'iroq qiling: +998 xx xxx xx xx\n\nBatafsil ma'lumot FarmMind Lite ilovasida.`;
        } else if (title.includes('Doctor') || title.includes('Doktor')) {
            text = `🚑 Ekinimda muammo chiqdi.\nAI Doktor shunday dedi: ${data.prediction || 'Unknown'}\nIshonch: ${(data.confidence * 100).toFixed(1)}%\n\nMaslahat bera olasizmi?`;
        }

        const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setSharing(!sharing)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-brand-dark transition-all border border-surface-200 font-bold"
            >
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-xs">{t('common.share')}</span>
            </button>

            {sharing && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setSharing(false)} />
                    <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => { exportPDF(); setSharing(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-100 transition-colors text-brand-dark text-sm"
                            >
                                <FileText className="w-4 h-4 text-blue-500" />
                                {t('share.exportPDF')}
                            </button>
                            <button
                                onClick={() => { shareToTelegram(); setSharing(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-100 transition-colors text-brand-dark text-sm"
                            >
                                <Send className="w-4 h-4 text-sky-500" />
                                {t('share.shareViaTelegram')}
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-100 transition-colors text-brand-dark text-sm"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4 text-gray-500" />}
                                {copied ? t('share.linkCopied') : t('share.copyLink')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
