"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/app/context/auth-provider"
import { supabase } from "@/lib/supabase"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, PlusCircle, Trash2, Pencil, Save, X, Database, RefreshCw } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

type Pena = {
  id: string
  nombre: string
  localizacion: string | null
  descripcion: string | null
  password: string
  logo: string | null
}

type Table = {
  name: string
  description: string
}

type TableColumn = {
  name: string
  type: string
  isNullable: boolean
}

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pena, setPena] = useState<Pena | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [installDbFunctionLoading, setInstallDbFunctionLoading] = useState(false)
  const [syncUsersLoading, setSyncUsersLoading] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)

  // Campos para editar
  const [nombre, setNombre] = useState("")
  const [localizacion, setLocalizacion] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Base de datos
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [tables, setTables] = useState<Table[]>([])
  const [columns, setColumns] = useState<TableColumn[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [loadingTable, setLoadingTable] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Edición de registros
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [newRecord, setNewRecord] = useState<any | null>(null)
  const [showNewRecordDialog, setShowNewRecordDialog] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null)
  const [filterColumn, setFilterColumn] = useState<string>("")
  const [filterValue, setFilterValue] = useState<string>("")

  useEffect(() => {
    const loadPenaInfo = async () => {
      if (!user?.pena_id) return

      try {
        // Cargar información de la peña
        const { data: penaData, error: penaError } = await supabase
          .from("penas")
          .select("id, nombre, localizacion, descripcion, password, logo")
          .eq("id", user.pena_id)
          .single()

        if (penaError) throw penaError

        setPena(penaData)
        setNombre(penaData.nombre || "")
        setLocalizacion(penaData.localizacion || "")
        setDescripcion(penaData.descripcion || "")
        setPassword(penaData.password || "")
        setConfirmPassword(penaData.password || "")

        // Verificar si el usuario es administrador
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id", user.id)
          .single()

        if (userError) throw userError

        setIsAdmin(userData.rol === "administrador")
        
        // Cargar lista de tablas relacionadas si es administrador
        if (userData.rol === "administrador") {
          await loadTablesList();
        }
      } catch (error) {
        console.error("Error al cargar información:", error)
        setError("No se pudo cargar la información de la peña")
      } finally {
        setLoading(false)
      }
    }

    loadPenaInfo()
  }, [user])
  
  const loadTablesList = async () => {
    try {
      // Definir tablas principales de la aplicación con descripciones
      const mainTables: Table[] = [
        { name: "usuarios", description: "Usuarios registrados en el sistema" },
        { name: "penas", description: "Peñas futboleras creadas" },
        { name: "partidos", description: "Partidos programados o jugados" },
        { name: "equipos", description: "Equipos formados para partidos" },
        { name: "jugadores_equipos", description: "Relación entre jugadores y equipos" },
        { name: "estadisticas_jugadores", description: "Estadísticas de jugadores en partidos" },
        { name: "multas", description: "Multas asignadas a usuarios" }
      ]
      
      setTables(mainTables)
    } catch (error) {
      console.error("Error al cargar tablas:", error)
    }
  }
  
  const loadTableData = async (tableName: string) => {
    if (!tableName) return
    
    try {
      setLoadingTable(true)
      setSelectedTable(tableName)
      
      // Obtener estructura de la tabla
      const { data: columnData, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: tableName })
      
      if (columnError) throw columnError
      
      // Formatear columnas para mostrar
      const formattedColumns = columnData.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        isNullable: col.is_nullable === 'YES'
      }));
      
      setColumns(formattedColumns)
      
      // Cargar datos con paginación
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' })
      
      // Si la tabla está relacionada con la peña actual, filtrar por peña_id
      if (['partidos', 'equipos', 'jugadores_equipos', 'estadisticas_jugadores', 'multas'].includes(tableName) && user?.pena_id) {
        query = query.eq('pena_id', user.pena_id)
      } else if (tableName === 'usuarios' && user?.pena_id) {
        query = query.eq('pena_id', user.pena_id)
      } else if (tableName === 'penas' && user?.pena_id) {
        query = query.eq('id', user.pena_id)
      }
      
      // Aplicar filtro si existe
      if (filterColumn && filterValue) {
        query = query.ilike(filterColumn, `%${filterValue}%`)
      }
      
      // Aplicar paginación
      const from = page * rowsPerPage
      const to = from + rowsPerPage - 1
      
      const { data: records, error: dataError, count } = await query
        .order('id', { ascending: true })
        .range(from, to)
      
      if (dataError) throw dataError
      
      setTableData(records || [])
      setTotalRecords(count || 0)
      
      // Inicializar el estado para un nuevo registro
      if (formattedColumns.length > 0) {
        const newRecordTemplate: any = {}
        formattedColumns.forEach(col => {
          if (col.name !== 'id' && col.name !== 'created_at' && col.name !== 'updated_at') {
            newRecordTemplate[col.name] = null
          }
        })
        
        // Precargar valores para pena_id si corresponde
        if (newRecordTemplate.hasOwnProperty('pena_id') && user?.pena_id) {
          newRecordTemplate.pena_id = user.pena_id
        }
        
        setNewRecord(newRecordTemplate)
      }
    } catch (error) {
      console.error(`Error al cargar datos de ${tableName}:`, error)
      setError(`No se pudieron cargar los datos de la tabla ${tableName}`)
    } finally {
      setLoadingTable(false)
    }
  }

  const handleInstallDbFunction = async () => {
    try {
      setInstallDbFunctionLoading(true)
      setError("")
      setSuccess("")
      
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al configurar la base de datos')
      }
      
      setSuccess('Funciones de base de datos instaladas correctamente. El administrador de base de datos está listo para usar.')
      
      // Recargar la lista de tablas después de instalar la función
      await loadTablesList()
    } catch (error) {
      console.error('Error al instalar funciones DB:', error)
      setError(error instanceof Error ? error.message : 'Error al configurar la base de datos')
    } finally {
      setInstallDbFunctionLoading(false)
    }
  }

  const handleSyncUsers = async () => {
    try {
      setSyncUsersLoading(true)
      setError("")
      setSuccess("")
      
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al sincronizar usuarios')
      }
      
      setSyncResults(data.results)
      setSuccess(`Sincronización completada. ${data.results.synced_users} usuarios sincronizados.`)
    } catch (error) {
      console.error('Error al sincronizar usuarios:', error)
      setError(error instanceof Error ? error.message : 'Error al sincronizar usuarios')
    } finally {
      setSyncUsersLoading(false)
    }
  }

  const handleSavePena = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!isAdmin) {
      setError("Solo los administradores pueden modificar la configuración de la peña")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    try {
      setSaving(true)

      const { error: updateError } = await supabase
        .from("penas")
        .update({
          nombre,
          localizacion,
          descripcion,
          password,
        })
        .eq("id", pena?.id)

      if (updateError) throw updateError

      setSuccess("Configuración guardada correctamente")
    } catch (err) {
      console.error("Error al guardar:", err)
      setError("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const copyPenaId = () => {
    if (!pena?.id) return

    navigator.clipboard.writeText(pena.id)
    setSuccess("ID de la peña copiado al portapapeles")

    // Limpiar el mensaje después de 3 segundos
    setTimeout(() => {
      setSuccess("")
    }, 3000)
  }
  
  const handleUpdateRecord = async () => {
    if (!selectedTable || !editingRecord || !editingRecord.id) {
      setError("No se puede actualizar el registro")
      return
    }
    
    try {
      setSaving(true)
      
      // Eliminar propiedades que no deben actualizarse
      const recordToUpdate = { ...editingRecord }
      
      const { error: updateError } = await supabase
        .from(selectedTable)
        .update(recordToUpdate)
        .eq('id', recordToUpdate.id)
      
      if (updateError) throw updateError
      
      setSuccess(`Registro actualizado correctamente en ${selectedTable}`)
      setEditingRecord(null)
      
      // Recargar datos de la tabla
      await loadTableData(selectedTable)
    } catch (err) {
      console.error("Error al actualizar registro:", err)
      setError(`Error al actualizar el registro en ${selectedTable}`)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCreateRecord = async () => {
    if (!selectedTable || !newRecord) {
      setError("No se puede crear el registro")
      return
    }
    
    try {
      setSaving(true)
      
      // Sanitizar el nuevo registro
      const recordToCreate = { ...newRecord }
      Object.keys(recordToCreate).forEach(key => {
        if (recordToCreate[key] === '') {
          recordToCreate[key] = null
        }
      })
      
      const { error: insertError } = await supabase
        .from(selectedTable)
        .insert(recordToCreate)
      
      if (insertError) throw insertError
      
      setSuccess(`Registro creado correctamente en ${selectedTable}`)
      setShowNewRecordDialog(false)
      
      // Recargar datos de la tabla
      await loadTableData(selectedTable)
    } catch (err) {
      console.error("Error al crear registro:", err)
      setError(`Error al crear el registro en ${selectedTable}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteRecord = async () => {
    if (!selectedTable || !recordToDelete || !recordToDelete.id) {
      setError("No se puede eliminar el registro")
      return
    }
    
    try {
      setSaving(true)
      
      const { error: deleteError } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', recordToDelete.id)
      
      if (deleteError) throw deleteError
      
      setSuccess(`Registro eliminado correctamente de ${selectedTable}`)
      setRecordToDelete(null)
      
      // Recargar datos de la tabla
      await loadTableData(selectedTable)
    } catch (err) {
      console.error("Error al eliminar registro:", err)
      setError(`Error al eliminar el registro de ${selectedTable}`)
    } finally {
      setSaving(false)
    }
  }
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadTableData(selectedTable)
  }
  
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value))
    setPage(0) // Resetear a la primera página
    loadTableData(selectedTable)
  }
  
  const applyFilter = () => {
    setPage(0) // Resetear a la primera página al aplicar filtro
    loadTableData(selectedTable)
  }
  
  const clearFilter = () => {
    setFilterColumn("")
    setFilterValue("")
    setPage(0)
    loadTableData(selectedTable)
  }
  
  const getFieldComponent = (column: TableColumn, value: any, onChange: (value: any) => void, isDisabled: boolean = false) => {
    // Determinar el tipo apropiado de componente basado en el tipo de columna
    const columnName = column.name
    const isNullable = column.isNullable
    
    if (columnName === 'id' || columnName === 'created_at' || columnName === 'updated_at') {
      return (
        <Input 
          value={value || ''} 
          disabled={true} 
          className="bg-muted"
        />
      )
    }
    
    // Para campos booleanos
    if (column.type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch 
            id={`field-${columnName}`}
            checked={value === true} 
            onCheckedChange={(checked) => onChange(checked)}
            disabled={isDisabled}
          />
          <Label htmlFor={`field-${columnName}`}>{value === true ? 'Sí' : 'No'}</Label>
        </div>
      )
    }
    
    // Para campos de fecha
    if (column.type.includes('timestamp') || column.type.includes('date')) {
      return (
        <Input 
          type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ''} 
          onChange={(e) => onChange(e.target.value)} 
          disabled={isDisabled}
        />
      )
    }
    
    // Para texto largo
    if (column.type === 'text' && (columnName.includes('descripcion') || columnName.includes('notas'))) {
      return (
        <Textarea 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          disabled={isDisabled}
          rows={3}
        />
      )
    }
    
    // Para números
    if (column.type.includes('int') || column.type.includes('numeric') || column.type.includes('float')) {
      return (
        <Input 
          type="number" 
          value={value !== null && value !== undefined ? value : ''} 
          onChange={(e) => onChange(e.target.valueAsNumber || null)} 
          disabled={isDisabled}
        />
      )
    }
    
    // Para campos relacionados con roles (usando un select)
    if (columnName === 'rol') {
      return (
        <Select 
          value={value || ''} 
          onValueChange={onChange}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="administrador">Administrador</SelectItem>
            <SelectItem value="miembro">Miembro</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    
    // Para campos relacionados con estados de partidos
    if (columnName === 'estado' && selectedTable === 'partidos') {
      return (
        <Select 
          value={value || ''} 
          onValueChange={onChange}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Jugado">Jugado</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    
    // Para el resto de campos (texto general)
    return (
      <Input 
        value={value !== null && value !== undefined ? value : ''} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={isDisabled}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestiona la configuración de tu peña futbolera.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="acceso">Acceso</TabsTrigger>
          <TabsTrigger value="database" disabled={!isAdmin}>Base de Datos</TabsTrigger>
        </TabsList>
        
        {/* Pestaña de información general */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Configura la información básica de tu peña</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="general-form" onSubmit={handleSavePena} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Peña</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={!isAdmin}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacion">Localización</Label>
                  <Input
                    id="localizacion"
                    value={localizacion}
                    onChange={(e) => setLocalizacion(e.target.value)}
                    disabled={!isAdmin}
                    placeholder="Ciudad, país"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={!isAdmin}
                    placeholder="Breve descripción de la peña"
                    rows={3}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              {isAdmin ? (
                <Button type="submit" form="general-form" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Solo los administradores pueden modificar la configuración
                </p>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Pestaña de información de acceso */}
        <TabsContent value="acceso" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de Acceso</CardTitle>
              <CardDescription>Gestiona cómo otros usuarios pueden unirse a tu peña</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ID de la Peña</Label>
                <div className="flex items-center gap-2">
                  <Input value={pena?.id || ""} readOnly />
                  <Button variant="outline" onClick={copyPenaId}>
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comparte este ID con los usuarios que quieras que se unan a tu peña
                </p>
              </div>

              <form id="password-form" onSubmit={handleSavePena} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña de la Peña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!isAdmin}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!isAdmin}
                    required
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              {isAdmin ? (
                <Button type="submit" form="password-form" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Contraseña"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Solo los administradores pueden modificar la contraseña</p>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Pestaña de base de datos (solo para administradores) */}
        <TabsContent value="database" className="space-y-4">
          {!isAdmin ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
                  <p className="text-muted-foreground">
                    Solo los administradores pueden acceder a la gestión de la base de datos
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Configuración de Base de Datos</CardTitle>
                  <CardDescription>
                    Instala las funciones necesarias para gestionar la base de datos desde esta interfaz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Funciones de base de datos</h3>
                      <div className="text-sm text-muted-foreground mb-4">
                        Para utilizar el administrador de base de datos, es necesario instalar funciones SQL en tu base de datos.
                        Este proceso debe realizarse una sola vez como administrador.
                      </div>
                      <Button 
                        onClick={handleInstallDbFunction} 
                        disabled={installDbFunctionLoading}
                      >
                        {installDbFunctionLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Instalando...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Instalar Funciones DB
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Sincronización de usuarios</h3>
                      <div className="text-sm text-muted-foreground mb-4">
                        Sincroniza los usuarios que existen en el sistema de autenticación pero no en la tabla usuarios.
                        Útil para resolver conflictos de datos.
                      </div>
                      <Button 
                        onClick={handleSyncUsers} 
                        disabled={syncUsersLoading}
                        variant="outline"
                      >
                        {syncUsersLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sincronizar Usuarios
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {syncResults && (
                    <div className="mt-6 p-4 border rounded-md bg-muted/50">
                      <h3 className="font-medium mb-2">Resultados de sincronización</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>Usuarios en sistema Auth: <span className="font-medium">{syncResults.total_auth_users}</span></div>
                        <div>Usuarios en tabla usuarios: <span className="font-medium">{syncResults.existing_users}</span></div>
                        <div>Usuarios para sincronizar: <span className="font-medium">{syncResults.users_to_sync}</span></div>
                        <div>Usuarios sincronizados: <span className="font-medium text-green-600">{syncResults.synced_users}</span></div>
                        {syncResults.failed_users > 0 && (
                          <div className="col-span-2">Usuarios con error: <span className="font-medium text-red-600">{syncResults.failed_users}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Panel lateral de tablas */}
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Tablas</CardTitle>
                    <CardDescription>Selecciona una tabla para gestionar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {tables.map((table) => (
                        <Button
                          key={table.name}
                          variant={selectedTable === table.name ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => loadTableData(table.name)}
                        >
                          {table.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Panel principal de datos */}
                <div className="md:col-span-9 space-y-4">
                  {selectedTable ? (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle>Tabla: {selectedTable}</CardTitle>
                          <CardDescription>
                            {tables.find(t => t.name === selectedTable)?.description || "Gestión de registros"}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => loadTableData(selectedTable)}
                            title="Recargar datos"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          
                          <Dialog open={showNewRecordDialog} onOpenChange={setShowNewRecordDialog}>
                            <DialogTrigger asChild>
                              <Button className="flex items-center gap-1">
                                <PlusCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Nuevo Registro</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Crear nuevo registro en {selectedTable}</DialogTitle>
                                <DialogDescription>
                                  Completa los campos para crear un nuevo registro en la tabla
                                </DialogDescription>
                              </DialogHeader>
                              
                              <ScrollArea className="h-[60vh] px-1">
                                <div className="grid gap-4 py-4">
                                  {newRecord && columns
                                    .filter(col => col.name !== 'id' && col.name !== 'created_at' && col.name !== 'updated_at')
                                    .map((column) => (
                                      <div key={column.name} className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor={`new-${column.name}`} className="text-right">
                                          {column.name}
                                          {!column.isNullable && <span className="text-destructive">*</span>}
                                        </Label>
                                        <div className="col-span-3">
                                          {getFieldComponent(
                                            column,
                                            newRecord[column.name],
                                            (value) => setNewRecord({...newRecord, [column.name]: value})
                                          )}
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {column.type}{column.isNullable ? '' : ' (requerido)'}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              </ScrollArea>
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowNewRecordDialog(false)}>Cancelar</Button>
                                <Button onClick={handleCreateRecord} disabled={saving}>
                                  {saving ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Guardando...
                                    </>
                                  ) : (
                                    'Crear Registro'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {/* Filtros */}
                        <div className="mb-4 flex flex-col sm:flex-row gap-2">
                          <Select value={filterColumn} onValueChange={setFilterColumn}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Campo para filtrar" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(col => (
                                <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex-1">
                            <Input
                              placeholder="Valor del filtro"
                              value={filterValue}
                              onChange={(e) => setFilterValue(e.target.value)}
                              disabled={!filterColumn}
                            />
                          </div>
                          
                          <Button variant="outline" onClick={applyFilter} disabled={!filterColumn || !filterValue}>
                            Filtrar
                          </Button>
                          
                          <Button variant="ghost" onClick={clearFilter} disabled={!filterColumn && !filterValue}>
                            Limpiar
                          </Button>
                        </div>
                        
                        {/* Columnas de la tabla */}
                        <Accordion type="single" collapsible className="mb-4">
                          <AccordionItem value="columns">
                            <AccordionTrigger>Estructura de la tabla</AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {columns.map(column => (
                                  <div key={column.name} className="border p-2 rounded-md">
                                    <div className="font-medium">{column.name}</div>
                                    <div className="text-xs text-muted-foreground">{column.type}</div>
                                    <Badge variant={column.isNullable ? "outline" : "secondary"} className="mt-1">
                                      {column.isNullable ? 'Nullable' : 'Required'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      
                        {/* Tabla de datos */}
                        {loadingTable ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : tableData.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No se encontraron registros
                          </div>
                        ) : (
                          <div className="rounded-md border">
                            <ScrollArea className="w-full overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {columns.slice(0, 6).map((column) => (
                                      <TableHead key={column.name}>{column.name}</TableHead>
                                    ))}
                                    <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {tableData.map((record) => (
                                    <TableRow key={record.id}>
                                      {columns.slice(0, 6).map((column) => (
                                        <TableCell key={column.name} className="max-w-[200px] truncate">
                                          {record[column.name] === null ? (
                                            <span className="text-muted-foreground italic">null</span>
                                          ) : record[column.name] === true ? (
                                            "Sí"
                                          ) : record[column.name] === false ? (
                                            "No"
                                          ) : column.type.includes('timestamp') || column.type.includes('date') ? (
                                            new Date(record[column.name]).toLocaleString()
                                          ) : (
                                            String(record[column.name])
                                          )}
                                        </TableCell>
                                      ))}
                                      <TableCell className="text-right space-x-1">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" title="Editar">
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="sm:max-w-2xl">
                                            <DialogHeader>
                                              <DialogTitle>Editar registro</DialogTitle>
                                              <DialogDescription>
                                                Modifica los campos del registro seleccionado
                                              </DialogDescription>
                                            </DialogHeader>
                                            
                                            <ScrollArea className="h-[60vh] px-1">
                                              <div className="grid gap-4 py-4" onClick={() => setEditingRecord(record)}>
                                                {columns.map((column) => (
                                                  <div key={column.name} className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor={`edit-${column.name}`} className="text-right">
                                                      {column.name}
                                                      {!column.isNullable && <span className="text-destructive">*</span>}
                                                    </Label>
                                                    <div className="col-span-3">
                                                      {getFieldComponent(
                                                        column,
                                                        record[column.name],
                                                        (value) => setEditingRecord({...editingRecord || record, [column.name]: value}),
                                                        column.name === 'id' // Deshabilitar la edición del campo ID
                                                      )}
                                                      <p className="text-xs text-muted-foreground mt-1">
                                                        {column.type}{column.isNullable ? '' : ' (requerido)'}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </ScrollArea>
                                            
                                            <DialogFooter>
                                              <Button 
                                                variant="default" 
                                                onClick={handleUpdateRecord} 
                                                disabled={saving || !editingRecord}
                                              >
                                                {saving ? (
                                                  <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Guardando...
                                                  </>
                                                ) : (
                                                  'Guardar Cambios'
                                                )}
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                        
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="text-destructive hover:text-destructive/90"
                                              title="Eliminar"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Se eliminará permanentemente este registro de la base de datos.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction 
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() => {
                                                  setRecordToDelete(record)
                                                  handleDeleteRecord()
                                                }}
                                              >
                                                {saving ? (
                                                  <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Eliminando...
                                                  </>
                                                ) : (
                                                  'Eliminar'
                                                )}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </div>
                        )}
                        
                        {/* Paginación */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Mostrando {tableData.length} de {totalRecords} registros
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              value={rowsPerPage}
                              onChange={handleRowsPerPageChange}
                            >
                              <option value={5}>5 por página</option>
                              <option value={10}>10 por página</option>
                              <option value={20}>20 por página</option>
                              <option value={50}>50 por página</option>
                            </select>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(0)}
                                disabled={page === 0}
                              >
                                ⟨⟨
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0}
                              >
                                ⟨
                              </Button>
                              <div className="px-3 py-1 border rounded flex items-center">
                                {page + 1} / {Math.max(1, Math.ceil(totalRecords / rowsPerPage))}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= Math.ceil(totalRecords / rowsPerPage) - 1}
                              >
                                ⟩
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(Math.ceil(totalRecords / rowsPerPage) - 1)}
                                disabled={page >= Math.ceil(totalRecords / rowsPerPage) - 1}
                              >
                                ⟩⟩
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Database className="h-12 w-12 text-muted-foreground mb-4" />
                          <h2 className="text-xl font-semibold mb-2">Selecciona una Tabla</h2>
                          <p className="text-muted-foreground max-w-md">
                            Selecciona una tabla del panel lateral para gestionar sus registros. Podrás ver, crear, editar y eliminar datos.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
