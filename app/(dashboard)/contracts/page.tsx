"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase, type Contract, type Customer, getDaysUntilService } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Plus, Search, Edit, Trash2, Download } from "lucide-react"
import { toast } from "sonner"
import { AddContractModal } from "@/components/add-contract-modal"
import jsPDF from "jspdf"

interface ContractDisplay extends Contract {
  customerName: string
}

function getStatusBadge(days: number, status: string) {
  if (days < 0) {
    return <Badge className="bg-alert-overdue/10 text-alert-overdue border-alert-overdue/20">Overdue</Badge>
  } else if (days === 0) {
    return <Badge className="bg-alert-due-today/10 text-alert-due-today border-alert-due-today/20">Due Today</Badge>
  } else if (days <= 3) {
    return <Badge className="bg-alert-due-today/10 text-alert-due-today border-alert-due-today/20">Due Soon</Badge>
  } else if (status === "active") {
    return <Badge className="bg-alert-success/10 text-alert-success border-alert-success/20">Active</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

function getServiceTypeBadge(type: string) {
  return (
    <Badge variant="outline" className="font-normal">
      {type}
    </Badge>
  )
}

export default function ContractsPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<ContractDisplay[]>([])
  const [filteredContracts, setFilteredContracts] = useState<ContractDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<ContractDisplay | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadContracts()
  }, [user?.id])

  const handleFilter = () => {
    let filtered = contracts

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.service_type.toLowerCase() === filterType.toLowerCase())
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => {
        const days = getDaysUntilService(c.next_service_date)
        if (filterStatus === 'overdue') return days < 0
        if (filterStatus === 'due-today') return days === 0
        if (filterStatus === 'due-soon') return days > 0 && days <= 7
        return c.status === filterStatus
      })
    }

    setFilteredContracts(filtered)
  }

  useEffect(() => {
    handleFilter()
  }, [searchTerm, filterType, filterStatus, contracts])

  const handleDelete = async () => {
    if (!contractToDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractToDelete.id)
      if (error) throw error
      setContracts(contracts.filter(c => c.id !== contractToDelete.id))
      toast.success('Contract deleted successfully')
      setDeleteDialogOpen(false)
      setContractToDelete(null)
    } catch (error) {
      toast.error('Failed to delete contract')
    } finally {
      setDeleting(false)
    }
  }

  const handleEditClick = (contract: ContractDisplay) => {
    setEditingContract(contract as Contract)
    setModalOpen(true)
  }

  const handleAddClick = () => {
    setEditingContract(null)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    loadContracts()
  }

  const loadContracts = async () => {
    try {
      if (!user?.id) return

      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)

      if (contractsError) throw contractsError

      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)

      const displayed = (contractsData as Contract[]).map(contract => {
        const customer = (customersData as Customer[])?.find(c => c.id === contract.customer_id)
        return {
          ...contract,
          customerName: customer?.name || 'Unknown'
        }
      })

      setContracts(displayed)
      setFilteredContracts(displayed)
    } catch (error) {
      console.error('Error loading contracts:', error)
      toast.error('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (days: number, status: string): string => {
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Due Today'
    if (days <= 3) return 'Due Soon'
    if (status === 'active') return 'Active'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getStatusPdfColor = (label: string): [number, number, number] => {
    switch (label) {
      case 'Active':    return [22, 163, 74]
      case 'Overdue':   return [220, 38, 38]
      case 'Due Today': return [202, 138, 4]
      case 'Due Soon':  return [234, 88, 12]
      default:          return [71, 85, 105]
    }
  }

  const exportContractsPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = 297
      const pageH = 210
      const margin = 14

      const skyBlue: [number, number, number]    = [41, 171, 226]
      const darkHeader: [number, number, number] = [22, 45, 60]
      const white: [number, number, number]      = [255, 255, 255]
      const rowAlt: [number, number, number]     = [240, 249, 255]
      const rowWhite: [number, number, number]   = [255, 255, 255]
      const textDark: [number, number, number]   = [15, 23, 42]
      const textMid: [number, number, number]    = [71, 85, 105]
      const borderCol: [number, number, number]  = [203, 213, 225]

      const data = filteredContracts
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

      doc.save(`contracts-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Contracts PDF exported successfully')
    } catch (error) {
      console.error('Error generating contracts PDF:', error)
      toast.error('Failed to export PDF')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
            <p className="text-muted-foreground">Manage your AMC contracts and service agreements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportContractsPDF} disabled={filteredContracts.length === 0}>
              <Download className="mr-2 size-4" />
              Export PDF
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 size-4" />
              Add Contract
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contracts..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ac">AC</SelectItem>
                    <SelectItem value="cctv">CCTV</SelectItem>
                    <SelectItem value="lift">Lift</SelectItem>
                    <SelectItem value="fire-safety">Fire Safety</SelectItem>
                    <SelectItem value="generator">Generator</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="due-today">Due Today</SelectItem>
                    <SelectItem value="due-soon">Due Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Contracts</CardTitle>
            <CardDescription>
              You have {filteredContracts.length} contracts {filterType !== 'all' || filterStatus !== 'all' ? 'matching filters' : 'in total'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading contracts...</div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No contracts found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const days = getDaysUntilService(contract.next_service_date)
                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contract_name}</TableCell>
                        <TableCell>{contract.customerName}</TableCell>
                        <TableCell>{getServiceTypeBadge(contract.service_type)}</TableCell>
                        <TableCell>{contract.frequency_days} days</TableCell>
                        <TableCell>
                          {contract.contracts_price != null
                            ? `₹${contract.contracts_price.toLocaleString('en-IN')}`
                            : '—'}
                        </TableCell>
                        <TableCell>{contract.start_date}</TableCell>
                        <TableCell>{contract.next_service_date}</TableCell>
                        <TableCell>{getStatusBadge(days, contract.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(contract)}
                              title="Edit Contract"
                            >
                              <Edit className="size-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setContractToDelete(contract); setDeleteDialogOpen(true) }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Contract"
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Contract Modal */}
        {user && (
          <AddContractModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSuccess={handleModalSuccess}
            editingContract={editingContract}
            userId={user.id}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contract</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {contractToDelete?.contract_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  )
}
