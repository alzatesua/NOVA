import React from 'react';

export default function UsersTable({ users }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-4 py-2 text-left">Usuario</th>
            <th className="px-4 py-2 text-left">Rol</th>
            <th className="px-4 py-2 text-left">Correo</th>
            <th className="px-4 py-2 text-left">Sucursal</th>
            <th className="px-4 py-2 text-left">Activo</th>
            <th className="px-4 py-2 text-left">Es admin</th>
            <th className="px-4 py-2 text-left">Creado en</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id_login_usuario} className="border-t border-gray-100">
              <td className="px-4 py-2">{u.usuario}</td>
              <td className="px-4 py-2">{u.rol}</td>
              <td className="px-4 py-2">{u.correo_usuario}</td>
              <td className="px-4 py-2">{u.id_sucursal_default}</td>
              <td className="px-4 py-2">
                <span className={`text-sm font-medium ${u.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {u.is_active ? 'Sí' : 'No'}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className={`text-sm font-medium ${u.is_admin ? 'text-green-600' : 'text-gray-500'}`}>
                    {u.is_admin ? 'Admin' : 'No'}
                </span>
              </td>
              <td className="px-4 py-2">{u.creado_en}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
