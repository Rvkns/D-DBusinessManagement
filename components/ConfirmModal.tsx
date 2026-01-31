import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDangerous?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = "Conferma",
    cancelText = "Annulla",
    onConfirm,
    onCancel,
    isDangerous = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-drow-900 border border-drow-500 rounded-xl shadow-[0_0_50px_rgba(107,59,173,0.4)] w-full max-w-md mx-4">
                <div className="bg-gradient-to-r from-drow-800 to-drow-900 p-5 border-b border-drow-600 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-white font-serif flex items-center">
                        <AlertTriangle className={`mr-2 ${isDangerous ? 'text-red-400' : 'text-drow-400'}`} size={20} />
                        {title}
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-300 leading-relaxed">{message}</p>
                </div>

                <div className="p-5 bg-drow-900 border-t border-drow-700 flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded text-gray-400 hover:text-white hover:bg-drow-800 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 rounded shadow-lg font-bold transition-all transform active:scale-95 ${isDangerous
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : 'bg-gradient-to-r from-drow-700 to-drow-500 hover:from-drow-600 hover:to-drow-400 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
