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
  { id: 'administrar', label: 'Administrar', icon: AdjustmentsHorizontalIcon, color: 'from-blue-600 to-blue-500', description: 'Gestiona tus bodegas existentes' },
  { id: 'crear-bodega', label: 'Crear bodega', icon: BuildingStorefrontIcon, color: 'from-blue-600 to-blue-500', description: 'Configura una nueva bodega' },
  { id: 'ajustar-existencia', label: 'Ajuste de inventario', icon: SparklesIcon, color: 'from-blue-600 to-blue-500', description: 'Modifica inventarios' },
  { id: 'realizar-traslado', label: 'Realizar traslado', icon: ArrowPathRoundedSquareIcon, color: 'from-blue-600 to-blue-500', description: 'Transfiere productos entre bodegas' },
  { id: 'enviar-traslado', label: 'Enviar traslado', icon: PaperAirplaneIcon, color: 'from-blue-600 to-blue-500', description: 'Despacha traslados pendientes' },
  { id: 'recibir-traslado', label: 'Recibir traslado', icon: ArchiveBoxArrowDownIcon, color: 'from-blue-600 to-blue-500', description: 'Acepta traslados entrantes' },
];
