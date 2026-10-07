/** O resultado que qualquer provedor de transcricao precisa devolver. */
export interface TranscriptionResult {
  text: string;
  model: string;
  durationSeconds?: number;
}

/**
 * A transcricao fica atras desta interface por dois motivos: a aplicacao
 * funciona inteira antes de existir uma chave da Groq, e trocar de provedor
 * nao exige mexer no servico.
 *
 * Classe abstrata, e nao interface TypeScript, porque o Nest precisa de um
 * token de injecao que exista em tempo de execucao.
 */
export abstract class TranscriptionProvider {
  abstract transcribe(
    file: Express.Multer.File,
    language: string,
  ): Promise<TranscriptionResult>;
}
