# A App `hr`

`hr` é uma app de domínio RH/folha de pagamento construída sobre as primitivas do `django_resaas`
(os seus models herdam a mesma convenção `BaseModel`/tenant — ver
[Referência pública da API](../api/public-api-reference.md)). **Não é opcional** do ponto de vista
do framework: `django_resaas/urls.py` faz `include('hr.urls')` incondicionalmente, pelo que uma
instalação que inclua `django_resaas` precisa também de `hr` instalado (ambas listadas em
`MY_APPS` no `src/dev/settings.py`).

## Models (`src/hr/models/__init__.py`)

- `Employee`, `Department`, `JobPosition` — estrutura organizacional central. `Employee` liga-se a
  `Person` (do `django_resaas`), um `manager` opcional (auto-referencial), e uma `position`.
- `Specialty`, `EmployeeSpecialty` — competências/especialidades que um funcionário pode ter.
- `Shift`, `EmployeeShift`, `ShiftSchedule`, `Attendance` — horário de trabalho e registo de
  entrada/saída. `Attendance` guarda `check_in`/`check_out`, `late_minutes`, `overtime_minutes`,
  `worked_minutes` e um `status` (ex.: `absent`, `late`).
- `SalaryComponent`, `EmployeeSalary` — componentes salariais configuráveis por funcionário.
- `PayrollPeriod`, `Payroll`, `PayrollItem`, `Payslip` — corridas de folha de pagamento e as suas
  linhas.

## Lógica de negócio

### `hr/services/attendance_service.py`

- `calculate_attendance(attendance)` — procura o `ShiftSchedule` do funcionário/data da
  assiduidade; se não existir nenhum, não faz nada. Caso contrário: marca a assiduidade `absent`
  se não houver `check_in`; se `check_in` for depois do `start_time` do turno, calcula
  `late_minutes` e marca `late`; se `check_out` estiver definido, calcula `worked_minutes`; se
  `check_out` for depois do `end_time` do turno, calcula `overtime_minutes`. Grava a instância.
- `check_in(employee)` / `check_out(employee)` — get-or-create (para check-in) ou obtém (para
  check-out) a linha `Attendance` de hoje do funcionário, regista a hora atual, e chama
  `calculate_attendance()`.

  **Problema conhecido:** este módulo usa `ShiftSchedule` e `Attendance` sem os importar — ambos
  são nomes indefinidos em `hr/services/attendance_service.py` tal como está escrito, pelo que
  chamar `check_in()`/`check_out()`/`calculate_attendance()` diretamente levanta `NameError` a
  menos que algo mais injete esses nomes no namespace do módulo primeiro. Sinalizado como
  pré-existente, fora do âmbito da passagem de profissionalização (sem alterações de lógica de
  negócio) — ver o plano de topo para o porquê de isto ter ficado por tocar.

### `hr/services/payroll_service.py`

- `calculate_salary(employee, base_salary, overtime_rate=1.5, late_penalty=0.5)` — soma
  `overtime_minutes` e `late_minutes` de todas as `attendances` do funcionário, calcula
  `overtime_pay = total_overtime * overtime_rate` e `late_discount = total_late * late_penalty`, e
  devolve `final_salary = base_salary + overtime_pay - late_discount` junto com os valores
  intermédios (`base_salary`, `overtime_minutes`, `late_minutes`, `overtime_pay`,
  `late_discount`, `final_salary`) num dicionário. Note-se a incompatibilidade de unidades: os
  minutos de overtime e atraso são multiplicados diretamente por uma taxa/penalização sem
  conversão explícita para horas ou uma base por-minuto de moeda — quem chama deve tratar
  `overtime_rate`/`late_penalty` como já sendo valores "por minuto", não "por hora".
