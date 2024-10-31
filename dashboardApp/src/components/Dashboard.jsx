import React from "react";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Phone,
  Mail,
  CalendarCheck2,
  CircleUser,
  HandPlatter,
  Info,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Clock2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "./datePickerRange";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";

export default function DataTableDemo() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [filteredData, setFilteredData] = useState([]);
  const [services, setServices] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://appointment-fr-12d3.onrender.com/reserve"
        ); // Remplacez l'URL par celle de votre backend

        setData(response.data.reservations); // Met à jour l'état avec les données récupérées depuis axios
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      }
    };

    fetchData(); // Appel de la fonction fetch au chargement du composant
  }, []);

  const filterDataByDateRange = (data, fromDate, toDate) => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const fromDateTime = new Date(fromDate);
    const toDateTime = new Date(toDate);

    // Adjust fromDateTime to the start of the day
    fromDateTime.setHours(0, 0, 0, 0);

    // Adjust toDateTime to the end of the day
    toDateTime.setHours(23, 59, 59, 999);

    return data.filter((item) => {
      const itemDateTime = new Date(item.date);
      // Adjust itemDateTime to the start of the day for comparison
      itemDateTime.setHours(0, 0, 0, 0);

      return itemDateTime >= fromDateTime && itemDateTime <= toDateTime;
    });
  };

  useEffect(() => {
    // Fonction pour récupérer les services depuis l'API
    const fetchServices = async () => {
      try {
        const response = await axios.get(
          "https://appointment-fr-12d3.onrender.com/services"
        );
        setServices(response.data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  const columns = [
    {
      accessorKey: "time_slot",
      header: "Time",
      cell: ({ row }) => (
        <div className="lowercase flex justify-between">
          <Clock2 />
          {row.getValue("time_slot")}
          <p className="w-6"></p>
        </div>
      ),
      sortingFn: (rowA, rowB, columnId, desc) => {
        const timeA = new Date(rowA.original[columnId]);
        const timeB = new Date(rowB.original[columnId]);

        return desc ? timeB - timeA : timeA - timeB;
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="secondary"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>{new Date(row.original.date).toLocaleDateString()}</div>
      ),
      sortingFn: (rowA, rowB, columnId, desc) => {
        const dateA = new Date(rowA.original[columnId]);
        const dateB = new Date(rowB.original[columnId]);

        // Compare dates first
        if (dateA.getTime() !== dateB.getTime()) {
          return desc ? dateB - dateA : dateA - dateB;
        } else {
          // If dates are the same, compare times
          const timeA = new Date(rowA.original["time_slot"]);
          const timeB = new Date(rowB.original["time_slot"]);

          return desc ? timeB - timeA : timeA - timeB;
        }
      },
    },
    {
      accessorKey: "client_email",
      header: ({ column }) => {
        return (
          <Button
            variant="secondary"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">
          <div className="font-bold">{row.original.client_name}</div>
          <div className="text-xs	">{row.getValue("client_email")}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <div className={`status-cell ${status}`}>
            {status && status.toUpperCase()}
          </div>
        );
      },
    },
    {
      accessorKey: "service",
      header: "Service",
      cell: ({ row }) => {
        const payment = row.original;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [service, setService] = useState(payment.service);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { toast } = useToast();
        {
          row.getValue("service");
        }

        const updateService = async (reservationId, newService) => {
          try {
            await axios.post(
              `https://appointment-fr-12d3.onrender.com/reserve/${reservationId}/service`,
              { service: newService }
            );

            const updatedData = data.map((item) =>
              item.id === reservationId
                ? { ...item, service: newService }
                : item
            );

            setData(updatedData);

            toast({
              description: "Service updated successfully",
              status: "success",
              className: "bg-[#008000]",
            });
            setService(newService); // Mettre à jour l'état local du service
          } catch (error) {
            console.error("Error updating service:", error);
            toast({
              description: "Not updated, try again !",
              status: "success",
              variant: "destructive",
            });
          }
        };

        return (
          <Select
            value={
              services.find((serviceItem) => serviceItem.name === service)
                ? service
                : service || ""
            }
            onValueChange={(value) => updateService(payment.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Services</SelectLabel>
                {services.map((serviceItem) => (
                  <SelectItem key={serviceItem.id} value={serviceItem.name}>
                    {serviceItem.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              {!services.find((serviceItem) => serviceItem.name === service) &&
                service && (
                  <SelectItem key="unknown" value={service} disabled>
                    {service}
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
        );
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [status] = useState(payment.status);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { toast } = useToast();

        // Function to update status via POST request
        const updateStatus = async (reservationId, newStatus) => {
          try {
            await axios.post(
              `https://appointment-fr-12d3.onrender.com/reserve/${reservationId}/status`,
              { status: newStatus }
            );
            // Update state or refresh data if needed
            const updatedData = data.map((item) =>
              item.id === reservationId ? { ...item, status: newStatus } : item
            );

            setData(updatedData);
            toast({
              description: "Status updated successfully !",
              status: "success",
              className: "bg-[#008000]",
            });
          } catch (error) {
            console.error("Error updating status:", error);
            toast({
              description: "Not updated, try again !",
              status: "success",
              variant: "destructive",
            });
          }
        };

        const deleteReservation = async (reservationId) => {
          try {
            await axios.delete(
              `https://appointment-fr-12d3.onrender.com/reserve/${reservationId}`
            );

            // Remove the deleted reservation from the state
            const updatedData = data.filter(
              (item) => item.id !== reservationId
            );
            setData(updatedData);

            toast({
              description: "Reservation deleted successfully",
              status: "success",
              className: "bg-[#008000]",
            });
          } catch (error) {
            console.error("Error deleting reservation:", error);
            toast({
              description: "Failed to delete reservation",
              status: "error",
              variant: "destructive",
            });
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => deleteReservation(payment.id)}
                className="bg-red-800"
              >
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleRowExpansion(row.id)}>
                View customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Select
                value={status}
                onValueChange={(value) => updateStatus(payment.id, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mettre à jour le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Statut</SelectLabel>
                    <SelectItem value="confirmed">confirmed</SelectItem>
                    <SelectItem value="cancelled">cancelled</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  useEffect(() => {
    if (dateRange && dateRange.from && dateRange.to) {
      const filtered = filterDataByDateRange(
        data,
        dateRange.from,
        dateRange.to
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data, dateRange]);

  const toggleRowExpansion = (rowId) => {
    setExpandedRowId(rowId === expandedRowId ? null : rowId);
  };
  return (
    <div className=" text-white mx-5 w-full">
      <Toaster />
      <div className="flex items-center py-2">
        <DatePickerWithRange className="mr-5" onSelect={setDateRange} />
        <Input
          placeholder="Filter emails..."
          value={
            columnFilters.find((filter) => filter.id === "client_email")
              ?.value || ""
          }
          onChange={(event) => {
            const value = event.target.value;
            setColumnFilters((prevFilters) => {
              const existingFilter = prevFilters.find(
                (filter) => filter.id === "client_email"
              );
              if (existingFilter) {
                return prevFilters.map((filter) =>
                  filter.id === "client_email" ? { ...filter, value } : filter
                );
              } else {
                return [...prevFilters, { id: "client_email", value }];
              }
            });
          }}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      setColumnVisibility({
                        ...columnVisibility,
                        [column.id]: value,
                      })
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRowId === row.id && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <div className="p-4">
                          <ul className="list-none pl-0 space-y-3">
                            <li className="flex items-start ">
                              <span className="flex font-bold	  min-w-[120px] text-white">
                                <CalendarCheck2 /> &nbsp; Time:
                              </span>
                              <span className="font-bold  text-white">
                                {new Date(row.original.date).toLocaleDateString(
                                  "fr-FR",
                                  { month: "long", day: "numeric" }
                                )}
                                &nbsp;à {row.original.time_slot}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="flex font-bold	  min-w-[120px] text-white">
                                <HandPlatter /> &nbsp; Service:
                              </span>
                              <span className="font-bold  text-white">
                                {row.original.service}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="flex font-bold	  min-w-[120px] text-white">
                                <Info /> &nbsp; info:
                              </span>
                              <span className="font-bold  text-white">
                                {row.original.description}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="flex font-bold	  min-w-[120px] text-white">
                                <CircleUser /> &nbsp; Name:
                              </span>
                              <span className="font-bold  text-white">
                                {row.original.client_name}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="flex font-bold	  min-w-[120px] text-white">
                                <Mail /> &nbsp; Email:&nbsp;
                              </span>
                              <span className="font-bold  text-white">
                                {row.original.client_email}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="flex font-bold	  min-w-[120px] text-white">
                                <Phone /> &nbsp; Phone:
                              </span>
                              <span className="font-bold  text-white">
                                {row.original.client_phone}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[550px]" />
                      <Skeleton className="h-4 w-[500px]" />
                    </div>
                  </div>{" "}
                  <div className="flex items-center space-x-4 mt-5">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[550px]" />
                      <Skeleton className="h-4 w-[500px]" />
                    </div>
                  </div>{" "}
                  <div className="flex items-center space-x-4 mt-5">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[550px]" />
                      <Skeleton className="h-4 w-[500px]" />
                    </div>
                  </div>{" "}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
