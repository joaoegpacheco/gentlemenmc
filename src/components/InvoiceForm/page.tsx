"use client";

import { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputNumber } from "@/components/ui/input-number";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectMultiple } from "@/components/ui/select-multiple";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { message } from "@/lib/message";
import { Upload as UploadIcon } from "lucide-react";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import { ptBR } from "date-fns/locale";

const invoiceSchema = z.object({
  totalAmount: z.number().min(0.01, "Valor total deve ser maior que zero"),
  selectedMembers: z.array(z.string()).min(1, "Selecione ao menos um membro"),
  eventDate: z.date().refine(date => !!date, { message: "Selecione a data do evento" }),
  visitorCount: z.number().min(0).default(0),
  visitorNames: z.array(z.string()).optional(),
  pix: z.string().optional(),
  file: z.instanceof(File).optional(),
});

export const InvoiceForm = () => {
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      selectedMembers: [],
      visitorCount: 0,
      visitorNames: [],
    },
  });

  const members$ = useObservable<{ user_id: string; user_name: string }[]>([]);
  const visitorCount$ = useObservable<number>(0);

  const members = useValue(members$);
  const visitorCount = useValue(visitorCount$);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("membros")
        .select("id, user_id, user_name");
      if (error) {
        message.error("Erro ao carregar membros");
      } else {
        members$.set(data);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const visitorNames = Array(visitorCount).fill("");
    form.setValue("visitorNames", visitorNames);
  }, [visitorCount, form]);

  const handleSave = async (values: z.infer<typeof invoiceSchema>) => {
    if (!values.file) {
      message.error("Selecione um arquivo de nota fiscal.");
      return;
    }

    const totalParticipants = values.selectedMembers.length + (values.visitorCount > 0 ? values.visitorCount : 0);
    const dividedAmount = values.totalAmount / totalParticipants;

    const user = await supabase.auth.getUser();
    if (!user) {
      message.error("Usuário não autenticado.");
      return;
    }

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError || !buckets.some((b) => b.name === "notas_fiscais")) {
      message.error('Bucket "notas_fiscais" não encontrado. Verifique o Supabase.');
      return;
    }

    const sanitizedFileName = values.file.name.replace(/\s+/g, "_");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("notas_fiscais")
      .upload(`${sanitizedFileName}`, values.file);

    if (uploadError) {
      message.error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      return;
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/notas_fiscais/${uploadData.path}`;

    const insertData: any = {
      valor_total: values.totalAmount,
      membros: values.selectedMembers,
      valor_dividido: dividedAmount,
      arquivo_url: fileUrl,
      pix: values.pix,
      data_evento: format(values.eventDate, "yyyy-MM-dd"),
    };

    if (values.visitorCount > 0) {
      insertData.quantidade_visitantes = values.visitorCount;
      insertData.visitantes = values.visitorNames || [];
    }

    // Insere os dados no banco
    const { error } = await supabase.from("notas_fiscais").insert([insertData]);

    if (error) {
      message.error("Erro ao salvar nota fiscal");
    } else {
      message.success("Nota fiscal salva com sucesso");
      form.reset();
      setVisitorCount(0);
    }
  };

  const selectedMembers = form.watch("selectedMembers");
  const totalAmount = form.watch("totalAmount");
  const visitorNames = form.watch("visitorNames") || [];

  const totalParticipants = (selectedMembers?.length || 0) + (visitorCount > 0 ? visitorCount : 0);
  const dividedAmount = totalAmount && totalParticipants > 0 ? totalAmount / totalParticipants : 0;

  return (
    <div className="max-w-2xl mx-auto w-full p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor total</FormLabel>
                <FormControl>
                  <InputNumber
                    placeholder="Valor total"
                    value={field.value}
                    onChange={(val) => field.onChange(val ?? 0)}
                    min={0}
                    step={0.01}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selectedMembers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Membros</FormLabel>
                <FormControl>
                  <SelectMultiple
                    options={members.map(m => ({ value: m.user_id, label: m.user_name }))}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Selecione os membros"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do evento</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full">
                        {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visitorCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visitantes</FormLabel>
                <FormControl>
                  <Select
                    value={visitorCount.toString()}
                    onValueChange={(val) => {
                      const count = parseInt(val);
                      visitorCount$.set(count);
                      field.onChange(count);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Quantidade de visitantes" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(11)].map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? "Nenhum visitante" : `${i} visitante${i > 1 ? "s" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {visitorCount > 0 && visitorNames.map((_, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`visitorNames.${index}` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do visitante {index + 1}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Nome do visitante ${index + 1}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="pix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIX para pagamento</FormLabel>
                <FormControl>
                  <Input placeholder="PIX para pagamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota Fiscal</FormLabel>
                <FormControl>
                  <div>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="w-full"
                    >
                      <UploadIcon className="mr-2 h-4 w-4" />
                      {field.value ? field.value.name : "Selecionar Nota Fiscal"}
                    </Button>
                    {field.value && (
                      <p className="text-sm text-muted-foreground mt-2">{field.value.name}</p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(selectedMembers?.length > 0 || visitorCount > 0) && totalAmount && (
            <div className="border rounded-lg mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro/Visitante</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMembers.map((id) => {
                    const member = members.find((m) => m.user_id === id);
                    return (
                      <TableRow key={id}>
                        <TableCell>{member?.user_name}</TableCell>
                        <TableCell>{formatCurrency(dividedAmount)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {visitorCount > 0 && visitorNames.map((name, index) => (
                    <TableRow key={`visitor-${index}`}>
                      <TableCell>{name || `Visitante ${index + 1}`}</TableCell>
                      <TableCell>{formatCurrency(dividedAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Nota Fiscal"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
