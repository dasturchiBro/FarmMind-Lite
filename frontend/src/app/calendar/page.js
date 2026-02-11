'use client';

import { useTranslation } from 'react-i18next';
import SeasonalCalendar from '../../components/SeasonalCalendar';

export default function CalendarPage() {
    const { t } = useTranslation();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <SeasonalCalendar />
        </div>
    );
}
