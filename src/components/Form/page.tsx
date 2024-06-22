"use client";
import React, { useState } from "react";
import { notification } from "antd";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cuqvbjobsgfbfahjrzeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZiam9ic2dmYmZhaGpyemVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5ODgxOTQsImV4cCI6MjAzNDU2NDE5NH0.4TzTzyJZSAnZckDTCEQrVYg6MLmpyHkg1VvI-gipXAU"
);

const dataAtual = new Date();

export function FormComand() {
  const [loading, setLoading] = useState(false);

  const onFinish = async () => {
    setLoading(true);
    const formulario = document.getElementById("form1");
    //@ts-ignore
    const formData = new FormData(formulario);
    const nome = formData.get("nome");
    const bebida = formData.get("bebida");

    try {
      await supabase.from("bebidas").insert([{ name: nome, drink: bebida }]);
      notification.success({ message: "Bebida adicionada com sucesso!" });
    } catch {
      notification.error({
        message: "Houve um erro na hora de cadastrar sua bebida.",
      });
    } finally {
      setLoading(false);
      formData.delete("nome");
      formData.delete("bebida");
    }
  };

  return (
    <>
      <form
        action={() => onFinish()}
        method="POST"
        id="form1"
        autoComplete="off"
        style={{
          width: 768,
          padding: 50,
          gap: 25,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <label htmlFor="nome">Nome:</label>
          <select
            style={{ width: "100%", height: 40, borderRadius: 4 }}
            name="nome"
            required
          >
            <option selected hidden></option>
            <option value="Alex">Alex</option>
            <option value="André">André</option>
            <option value="Athayde">Athayde</option>
            <option value="Bacelar">Bacelar</option>
            <option value="Baeza">Baeza</option>
            <option value="Beto">Beto</option>
            <option value="Cláudio">Cláudio</option>
            <option value="Fernando">Fernando</option>
            <option value="Giuliano">Giuliano</option>
            <option value="Gulitich">Gulitich</option>
            <option value="Índio">Índio</option>
            <option value="Jeferson">Jeferson</option>
            <option value="João Marius">João Marius</option>
            <option value="Madalosso">Madalosso</option>
            <option value="Maicon">Maicon</option>
            <option value="Mega">Mega</option>
            <option value="Mortari">Mortari</option>
            <option value="Pacheco">Pacheco</option>
            <option value="Rafael">Rafael</option>
            <option value="Rodrigo N.D">Rodrigo N.D</option>
            <option value="Rodrigo">Rodrigo</option>
            <option value="Rogério">Rogério</option>
            <option value="Weriton">Weriton</option>
            <option value="Zanona">Zanona</option>
            <option value="Zeca">Zeca</option>
            <option value="Zé Carlos">Zé Carlos</option>
            <option value="Robson">Robson</option>
            <option value="Romanel">Romanel</option>
          </select>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <label htmlFor="bebida">Bebida:</label>
          <select
            style={{ width: "100%", height: 40, borderRadius: 4 }}
            name="bebida"
            required
          >
            <option selected hidden></option>
            <option value="Long Neck">Long Neck</option>
            <option value="Refrigerante">Refrigerante</option>
            <option value="Água">Água</option>
            <option value="Energético">Energético</option>
            <option value="Vinho Cordero">Vinho Cordero</option>
            <option value="Vinho Luigi Bosca">Vinho Luigi Bosca</option>
            <option value="Heineken 1L Lata">Heineken 1L Lata</option>
            <option value="Dose Jagermeister">Dose Jagermeister</option>
            <option value="Dose Jack Daniels">Dose Jack Daniels</option>
          </select>
        </div>
        {loading ? (
          <input
            disabled
            style={{
              width: "100%",
              height: 40,
              textAlign: "center",
              backgroundColor: "dodgerblue",
              border: "dodgerblue",
              color: "white",
              borderRadius: 8,
            }}
            value="..Carregando.."
          />
        ) : (
          <input
            form="form1"
            disabled={loading}
            style={{
              width: "100%",
              height: 40,
              backgroundColor: "dodgerblue",
              border: "dodgerblue",
              color: "white",
              borderRadius: 8,
            }}
            type="submit"
            value="Adicionar"
          />
        )}
        <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
          <label htmlFor="dataAtual">Data Atual:</label>
          <span>{dataAtual.toDateString()}</span>
        </div>
      </form>
    </>
  );
}
