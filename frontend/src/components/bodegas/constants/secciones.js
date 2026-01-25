// src/components/bodegas/constants/secciones.js
import {
  AdjustmentsHorizontalIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  ArrowPathRoundedSquareIcon,
  PaperAirplaneIcon,
  ArchiveBoxArrowDownIcon,
} from '@heroicons/react/24/solid';

export const SECCIONES = [
  { id: 'administrar', label: 'Administrar', icon: AdjustmentsHorizontalIcon, color: 'from-blue-500 to-cyan-500', description: 'Gestiona tus bodegas existentes' },
  { id: 'crear-bodega', label: 'Crear bodega', icon: BuildingStorefrontIcon, color: 'from-purple-500 to-pink-500', description: 'Configura una nueva bodega' },
  { id: 'ajustar-existencia', label: 'Ajuste de inventario', icon: SparklesIcon, color: 'from-emerald-500 to-teal-500', description: 'Modifica inventarios' },
  { id: 'realizar-traslado', label: 'Realizar traslado', icon: ArrowPathRoundedSquareIcon, color: 'from-orange-500 to-red-500', description: 'Transfiere productos entre bodegas' },
  { id: 'enviar-traslado', label: 'Enviar traslado', icon: PaperAirplaneIcon, color: 'from-indigo-500 to-purple-500', description: 'Despacha traslados pendientes' },
  { id: 'recibir-traslado', label: 'Recibir traslado', icon: ArchiveBoxArrowDownIcon, color: 'from-green-500 to-emerald-500', description: 'Acepta traslados entrantes' },
];
