"use client"

import { toast } from "sonner"
import Papa from "papaparse";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, ChangeEvent, FormEvent } from "react";


const fieldRules: { [key: string]: number } = {
  bic: 20,
  inscricao: 50,
  engloba_bic: 20,
  distrito: 5,
  setor: 5,
  zona: 5,
  quadra: 6,
  lote: 10,
  unidade: 15,
  matricula_numero: 20,
  matricula_data: 10,
  matricula_quadra: 6,
  matricula_lote: 10,
  situacao_cadastro: 60,
  codigo_logradouro: 10,
  tipo_logradouro: 30,
  nome_logradouro: 200,
  numero_predial: 10,
  complemento: 100,
  codigo_bairro: 10,
  nome_bairro: 80,
  loteamento: 120,
  cep: 10,
  rua_correspondencia: 200,
  numero_correspondencia: 10,
  complemento_correspondencia: 100,
  bairro_correspondencia: 80,
  cidade_correspondencia: 100,
  codigo_proprietario: 20,
  nome_proprietario: 180,
  codigo_responsavel: 20,
  nome_responsavel: 180,
  documento: 50,
  testada_principal: 10,
  area_terreno: 10,
  calcada: 5,
  pavimentos: 10,
  muro: 5,
  localizacao: 60,
  formato: 60,
  topologia: 60,
  pedologia: 60,
  lei_uso_solo: 30,
  uso: 60,
  patrimonio: 60,
  ocupacao: 60,
  valor_m2: 20,
  vvt: 20,
  vvi: 20,
  aliquota: 10,
  iptu: 10,
  area_edificada: 10,
  area_irregular: 10,
  posicao: 60,
  padrao_construtivo: 60,
  idade_aparente: 60,
  estado_conservacao: 60,
  vve: 20,
  alvara: 20,
  data_alvara: 10,
  habite_se: 20,
  data_habite_se: 10,
};

const decimalFields = [
  "testada_principal",
  "area_terreno",
  "valor_m2",
  "vvi",
  "vvt",
  "iptu",
  "area_edificada",
  "vve",
];

function removeBOM(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) {
    return text.slice(1);
  }
  return text;
}


async function transformCSV(file: File, setLogs: React.Dispatch<React.SetStateAction<string[]>>): Promise<string | null> {
  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    setLogs((prevLogs) => [...prevLogs, "Iniciando leitura do arquivo CSV..."]);

    reader.onload = (event) => {
      let text = event.target?.result as string;
      text = removeBOM(text);

      Papa.parse(text, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: function (results: Papa.ParseResult<any>) {

          setLogs((prevLogs) => [...prevLogs, "Parsing do CSV concluído. Iniciando transformação..."]);

          const transformedData = results.data.map((row: any) => {
            const processedRow: { [key: string]: string } = {};

            for (const [field, value] of Object.entries(row)) {
              let processedValue = value as string;

              // Cortar o valor baseado nas regras de tamanho dos campos
              if (processedValue.length > (fieldRules[field] || processedValue.length)) {
                processedValue = processedValue.slice(0, fieldRules[field]);
              }

              // Limitar campos decimais a duas casas decimais
              if (decimalFields.includes(field)) {
                const [integerPart, decimalPart] = processedValue.split(".");
                if (decimalPart && decimalPart.length > 2) {
                  processedValue = `${integerPart}.${decimalPart.slice(0, 2)}`;
                }
              }

              processedRow[field] = processedValue;
            }
            return processedRow;
          });


          const cleanedData = transformedData.filter(row => Object.values(row).some(value => value.trim() !== ''));
          const csv = Papa.unparse(cleanedData, { delimiter: ";" });

          setLogs((prevLogs) => [...prevLogs, "Transformação concluída. CSV pronto para download."]);
          resolve(csv);
        },
        error: (error: any) => {
          setLogs((prevLogs) => [...prevLogs, `Erro no parsing: ${error.message || error}`]);
          reject(error.message || error);
        },
      });
    };

    reader.onerror = () => {
      setLogs((prevLogs) => [...prevLogs, "Erro ao ler o arquivo."]);
      reject("Erro ao ler o arquivo.");
    };

    reader.readAsText(file, 'UTF-8');
  });
}
export default function Home() {

  const [file, setFile] = useState<File | null>(null)
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {

    if (!e.target.files) {
      setFile(null);
      return;
    }
    setFile(e.target.files[0]);

  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) {
      toast.warning("Nenhum arquivo foi selecionado")
      return
    }

    try {
      const csv = await transformCSV(file, setLogs)

      if (csv) {
        setCsvResult(csv);
        toast.success("Arquivo processado com sucesso!")
      } else {

        toast.error("Erro ao transformar CSV")
      }
    }
    catch (error) {
      toast.error(`Erro ao processar o arquivo: ${error}`)
    }
  }
  function downloadCSV() {
    if (!csvResult) return;

    const blob = new Blob([csvResult], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "processed.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex h-screen border items-center flex-col">

      <h1 className="pt-20 py-10 text-5xl">Filtrar CSV</h1>
      <form onSubmit={(e) => handleSubmit(e)} className="p-4 flex items-center flex-col gap-4 w-1/4">
        <Input accept=".csv" className=" p-3 h-[50px]" type="file" placeholder="csv" onChange={(e) => handleChange(e)} />
        <Button className="w-[300px]" >Enviar</Button>
      </form>

      <div className="p-4  w-1/4 items-center flex flex-col gap-4">
        <code className="border w-full p-5 h-[200px] rounded bg-neutral-800 text-white overflow-y-auto" >
          {logs.length > 0 ? logs.map((log, index) => <div key={index}>{log}</div>) : "Logs de resposta"}
        </code>
        <Button className="w-[300px]" onClick={downloadCSV} disabled={!csvResult} variant="outline" >Baixar</Button>
      </div>

    </div>
  );
}
