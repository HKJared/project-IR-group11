# project-IR-group11
B1
    đưa thu mục elasticsearch... vào utils, đổi tên thành elasticsearch
B2
    bật terminal (ctrl + `) chạy lệnh npm run elasticsearch và chờ đến khi có đoạn mã này xuất hiện
    
    <!-- Đoạn mã trọng tâm là từ YELLOW -->
    ... [2024-10-14T21:29:06,624][INFO ][o.e.h.n.s.HealthNodeTaskExecutor] [LAPTOP-1GDF2GD5] Node [{LAPTOP-1GDF2GD5}{4dzkCDAdSr6mOD4BBde4BA}] is selected as the current health node.
    [2024-10-14T21:29:07,539][INFO ][o.e.c.r.a.AllocationService] [LAPTOP-1GDF2GD5] current.health="YELLOW" message="Cluster health status changed from [RED] to [YELLOW] (reason: [shards started [[products][1]]])." previous.health="RED" reason="shards started [[products][1]]"
    [2024-10-14T21:29:22,529][INFO ][o.e.c.m.MetadataDeleteIndexService] [LAPTOP-1GDF2GD5] [exams/j-s_SMABQcO_4_krX80cPw] deleting index ...
B3
    sau khi xuất hiện đoạn mã, mở thêm một terminal (ctrl + shift + `) và chạy lệnh npm start
B4
    truy cập đường dẫn được console từ terminal (VD: localhost:8080)