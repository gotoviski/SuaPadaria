import java.util.Scanner;

class FluxoCaixa {
    public static void main(String[] args) {
        double saldo;
        double saida;
        double resultado;

        Scanner scanner = new Scanner(System.in);
        saida = scanner.nextDouble();
        saldo = scanner.nextDouble();
        resultado = saldo - saida;

        System.out.println("Saldo final: " + resultado);

    }
}