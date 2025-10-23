import React from 'react';

const iconProps = {
    className: "w-5 h-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export const CameraIcon: React.FC = () => (
    <svg {...iconProps}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

export const UploadIcon: React.FC = () => (
    <svg {...iconProps}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

export const ManualIcon: React.FC = () => (
    <svg {...iconProps} className="w-5 h-5 text-gray-400">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);


export const TrashIcon: React.FC = () => (
    <svg {...iconProps} className="w-5 h-5">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

export const ExportIcon: React.FC = () => (
    <svg {...iconProps}>
        <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
        <line x1="12" y1="11" x2="12" y2="17"></line>
        <polyline points="9 14 12 17 15 14"></polyline>
    </svg>
);

export const BarcodeIcon: React.FC = () => (
    <svg {...iconProps} className="w-5 h-5 text-gray-400">
        <path d="M3 6v12"></path>
        <path d="M6 6v12"></path>
        <path d="M9 6v12"></path>
        <path d="M12 6v12"></path>
        <path d="M17 6v12"></path>
        <path d="M21 6v12"></path>
        <path d="M15 6v12"></path>
    </svg>
);

export const SoundOnIcon: React.FC = () => (
    <svg {...iconProps} className="w-6 h-6">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

export const SoundOffIcon: React.FC = () => (
    <svg {...iconProps} className="w-6 h-6">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
);

export const SearchIcon: React.FC = () => (
    <svg {...iconProps} className="w-5 h-5 text-gray-400">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export const VibrationOnIcon: React.FC = () => (
    <svg {...iconProps} className="w-6 h-6">
        <path d="M16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3Z" />
        <path d="M2 10h2" />
        <path d="M2 14h2" />
        <path d="M20 10h2" />
        <path d="M20 14h2" />
    </svg>
);

export const VibrationOffIcon: React.FC = () => (
    <svg {...iconProps} className="w-6 h-6">
        <path d="M16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3Z" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);